import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import Nav from "@/components/Nav";
import { getSessionUser } from "@/lib/auth/cognito";
import { cognitoConfigured } from "@/lib/auth/config";
import { dbConfigured, getDb } from "@/db/client";
import { articles, profiles, sentences } from "@/db/schema";

function ymd(v: unknown) {
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default async function MyPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="text-2xl font-bold text-ink">마이페이지</h1>
          <p className="mt-4 text-sm text-ink/60">
            {cognitoConfigured ? (
              <>
                로그인이 필요합니다.{" "}
                <Link href="/login" className="font-medium text-brand">
                  로그인
                </Link>
              </>
            ) : (
              "미리보기 모드 — AWS 미연결 상태입니다."
            )}
          </p>
        </main>
      </>
    );
  }

  let nickname: string | null = null;
  let myArticles: { id: number; title: string | null; createdAt: unknown }[] =
    [];
  let myShared: { id: number; text: string; createdAt: unknown }[] = [];

  if (dbConfigured) {
    const db = getDb();
    const prof = await db
      .select({ nickname: profiles.nickname })
      .from(profiles)
      .where(eq(profiles.userSub, user.sub))
      .limit(1);
    nickname = prof[0]?.nickname ?? null;

    myArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        createdAt: articles.createdAt,
      })
      .from(articles)
      .where(eq(articles.writerSub, user.sub))
      .orderBy(desc(articles.createdAt))
      .limit(50);

    myShared = await db
      .select({
        id: sentences.id,
        text: sentences.text,
        createdAt: sentences.createdAt,
      })
      .from(sentences)
      .where(eq(sentences.writerSub, user.sub))
      .orderBy(desc(sentences.createdAt))
      .limit(100);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-ink">
          {nickname ?? user.email ?? "마이페이지"}
        </h1>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-ink/70">
            내가 쓴 글 ({myArticles.length})
          </h2>
          {myArticles.length === 0 ? (
            <p className="text-sm text-ink/40">아직 발행한 글이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {myArticles.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3 text-sm"
                >
                  <span className="text-ink">{a.title || "무제"}</span>
                  <span className="text-xs text-ink/40">{ymd(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-ink/70">
            내 문장 ({myShared.length})
          </h2>
          {myShared.length === 0 ? (
            <p className="text-sm text-ink/40">아직 쓴 문장이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {myShared.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-ink/10 px-4 py-3 text-sm text-ink/80"
                >
                  {s.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
