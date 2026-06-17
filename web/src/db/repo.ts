import "server-only";
import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { mockMode } from "@/lib/auth/config";
import { dbConfigured, getDb } from "./client";
import {
  articles,
  profiles,
  reports,
  sentences,
  sentenceUsages,
} from "./schema";

// 모든 데이터 접근은 이 레포지토리를 통한다.
// mockMode면 인메모리 store, 아니면 Aurora(Drizzle), 둘 다 아니면 빈 결과.

export type FeedRow = {
  id: number;
  text: string;
  createdAt: unknown;
  nickname: string | null;
};
export type SentenceStatus = "draft" | "used" | "shared";

const HIDE_THRESHOLD = 3;

// ───────────────────────── 인메모리 mock store ─────────────────────────
type MSentence = {
  id: number;
  writerSub: string | null;
  text: string;
  status: SentenceStatus;
  isHidden: boolean;
  createdAt: Date;
};
type MArticle = {
  id: number;
  writerSub: string | null;
  title: string | null;
  body: string;
  sourceSentenceIds: number[];
  createdAt: Date;
};
type MProfile = {
  userSub: string;
  nickname: string | null;
  message: string | null;
};

const mem = {
  sentences: [] as MSentence[],
  articles: [] as MArticle[],
  profiles: [] as MProfile[],
  usages: [] as { sentenceId: number; articleId: number; usedBySub: string | null }[],
  reports: [] as { sentenceId: number; reporterSub: string | null }[],
  seqS: 0,
  seqA: 0,
  seeded: false,
};

function seed() {
  if (mem.seeded) return;
  mem.seeded = true;
  mem.profiles.push({ userSub: "seed-author", nickname: "지난계절", message: null });
  const samples = [
    "창문 밖으로 첫눈이 내리던 새벽, 나는 오래된 편지를 꺼냈다.",
    "지하철에서 마주친 낯선 사람의 표정이 하루 종일 떠나지 않았다.",
    "커피가 식는 동안에도 시간은 멈추지 않는다는 게 조금 서글펐다.",
  ];
  for (const text of samples) {
    mem.sentences.push({
      id: ++mem.seqS,
      writerSub: "seed-author",
      text,
      status: "shared",
      isHidden: false,
      createdAt: new Date(),
    });
  }
}

// ───────────────────────── 프로필 ─────────────────────────
export async function getProfileNickname(
  userSub: string,
): Promise<string | null> {
  if (mockMode) {
    seed();
    return mem.profiles.find((p) => p.userSub === userSub)?.nickname ?? null;
  }
  if (!dbConfigured) return null;
  const rows = await getDb()
    .select({ nickname: profiles.nickname })
    .from(profiles)
    .where(eq(profiles.userSub, userSub))
    .limit(1);
  return rows[0]?.nickname ?? null;
}

export async function getProfile(
  userSub: string,
): Promise<{ nickname: string | null; message: string | null } | null> {
  if (mockMode) {
    seed();
    const p = mem.profiles.find((x) => x.userSub === userSub);
    return p ? { nickname: p.nickname, message: p.message } : null;
  }
  if (!dbConfigured) return null;
  const rows = await getDb()
    .select({ nickname: profiles.nickname, message: profiles.message })
    .from(profiles)
    .where(eq(profiles.userSub, userSub))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertProfile(
  userSub: string,
  nickname: string,
  message: string | null,
): Promise<void> {
  if (mockMode) {
    seed();
    const existing = mem.profiles.find((p) => p.userSub === userSub);
    if (existing) {
      existing.nickname = nickname;
      existing.message = message;
    } else {
      mem.profiles.push({ userSub, nickname, message });
    }
    return;
  }
  await getDb()
    .insert(profiles)
    .values({ userSub, nickname, message })
    .onConflictDoUpdate({
      target: profiles.userSub,
      set: { nickname, message },
    });
}

// ───────────────────────── 문장 ─────────────────────────
export async function createSentences(
  writerSub: string,
  items: { text: string; selected: boolean }[],
): Promise<{ selectedIds: number[] }> {
  const cleaned = items
    .map((i) => ({ text: i.text.trim(), selected: i.selected }))
    .filter((i) => i.text.length > 0);

  if (mockMode) {
    seed();
    const selectedIds: number[] = [];
    for (const c of cleaned) {
      const id = ++mem.seqS;
      mem.sentences.push({
        id,
        writerSub,
        text: c.text,
        status: c.selected ? "draft" : "shared",
        isHidden: false,
        createdAt: new Date(),
      });
      if (c.selected) selectedIds.push(id);
    }
    return { selectedIds };
  }

  const rows = cleaned.map((c) => ({
    writerSub,
    text: c.text,
    status: (c.selected ? "draft" : "shared") as SentenceStatus,
  }));
  const inserted = await getDb()
    .insert(sentences)
    .values(rows)
    .returning({ id: sentences.id, status: sentences.status });
  return {
    selectedIds: inserted.filter((r) => r.status === "draft").map((r) => r.id),
  };
}

export async function getStarterSentences(
  userSub: string,
  ids: number[],
): Promise<{ id: number; text: string }[]> {
  if (ids.length === 0) return [];
  if (mockMode) {
    seed();
    return mem.sentences
      .filter(
        (s) =>
          ids.includes(s.id) &&
          (s.writerSub === userSub || s.status === "shared"),
      )
      .map((s) => ({ id: s.id, text: s.text }));
  }
  if (!dbConfigured) return [];
  return getDb()
    .select({ id: sentences.id, text: sentences.text })
    .from(sentences)
    .where(
      and(
        inArray(sentences.id, ids),
        or(eq(sentences.writerSub, userSub), eq(sentences.status, "shared")),
      ),
    );
}

// ───────────────────────── 글 발행 ─────────────────────────
export async function publishArticle(
  writerSub: string,
  data: { title: string | null; body: string; sourceIds: number[] },
): Promise<void> {
  const { title, body, sourceIds } = data;

  if (mockMode) {
    seed();
    const id = ++mem.seqA;
    mem.articles.push({
      id,
      writerSub,
      title,
      body,
      sourceSentenceIds: sourceIds,
      createdAt: new Date(),
    });
    for (const sid of sourceIds) {
      const s = mem.sentences.find(
        (x) => x.id === sid && x.writerSub === writerSub,
      );
      if (s) s.status = "used";
      mem.usages.push({ sentenceId: sid, articleId: id, usedBySub: writerSub });
    }
    return;
  }

  const db = getDb();
  const [article] = await db
    .insert(articles)
    .values({ writerSub, title, body, sourceSentenceIds: sourceIds })
    .returning({ id: articles.id });

  if (sourceIds.length > 0) {
    await db
      .update(sentences)
      .set({ status: "used" })
      .where(
        and(inArray(sentences.id, sourceIds), eq(sentences.writerSub, writerSub)),
      );
    await db.insert(sentenceUsages).values(
      sourceIds.map((sid) => ({
        sentenceId: sid,
        usedInArticleId: article.id,
        usedBySub: writerSub,
      })),
    );
  }
}

// ───────────────────────── 커뮤니티 ─────────────────────────
export async function getCommunityFeed(): Promise<FeedRow[]> {
  if (mockMode) {
    seed();
    return mem.sentences
      .filter((s) => s.status === "shared" && !s.isHidden)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50)
      .map((s) => ({
        id: s.id,
        text: s.text,
        createdAt: s.createdAt,
        nickname:
          mem.profiles.find((p) => p.userSub === s.writerSub)?.nickname ?? null,
      }));
  }
  if (!dbConfigured) return [];
  return getDb()
    .select({
      id: sentences.id,
      text: sentences.text,
      createdAt: sentences.createdAt,
      nickname: profiles.nickname,
    })
    .from(sentences)
    .leftJoin(profiles, eq(profiles.userSub, sentences.writerSub))
    .where(and(eq(sentences.status, "shared"), eq(sentences.isHidden, false)))
    .orderBy(desc(sentences.createdAt))
    .limit(50);
}

export async function reportAndMaybeHide(
  reporterSub: string,
  sentenceId: number,
): Promise<void> {
  if (mockMode) {
    seed();
    mem.reports.push({ sentenceId, reporterSub });
    const c = mem.reports.filter((r) => r.sentenceId === sentenceId).length;
    if (c >= HIDE_THRESHOLD) {
      const s = mem.sentences.find((x) => x.id === sentenceId);
      if (s) s.isHidden = true;
    }
    return;
  }

  const db = getDb();
  await db
    .insert(reports)
    .values({ sentenceId, reporterSub, reason: "user_report" });
  const [{ c }] = await db
    .select({ c: count() })
    .from(reports)
    .where(eq(reports.sentenceId, sentenceId));
  if (Number(c) >= HIDE_THRESHOLD) {
    await db
      .update(sentences)
      .set({ isHidden: true })
      .where(eq(sentences.id, sentenceId));
  }
}

// ───────────────────────── 마이페이지 ─────────────────────────
export async function getMyArticles(
  userSub: string,
): Promise<{ id: number; title: string | null; createdAt: unknown }[]> {
  if (mockMode) {
    seed();
    return mem.articles
      .filter((a) => a.writerSub === userSub)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((a) => ({ id: a.id, title: a.title, createdAt: a.createdAt }));
  }
  if (!dbConfigured) return [];
  return getDb()
    .select({
      id: articles.id,
      title: articles.title,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .where(eq(articles.writerSub, userSub))
    .orderBy(desc(articles.createdAt))
    .limit(50);
}

export async function getMySentences(
  userSub: string,
): Promise<{ id: number; text: string; createdAt: unknown }[]> {
  if (mockMode) {
    seed();
    return mem.sentences
      .filter((s) => s.writerSub === userSub)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((s) => ({ id: s.id, text: s.text, createdAt: s.createdAt }));
  }
  if (!dbConfigured) return [];
  return getDb()
    .select({
      id: sentences.id,
      text: sentences.text,
      createdAt: sentences.createdAt,
    })
    .from(sentences)
    .where(eq(sentences.writerSub, userSub))
    .orderBy(desc(sentences.createdAt))
    .limit(100);
}
