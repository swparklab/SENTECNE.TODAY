import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import Nav from "@/components/Nav";
import { getSessionUser } from "@/lib/auth/cognito";
import { dbConfigured, getDb } from "@/db/client";
import { profiles, sentences } from "@/db/schema";
import { reportSentence } from "./actions";

type FeedRow = {
  id: number;
  text: string;
  createdAt: unknown;
  nickname: string | null;
};

function ymd(v: unknown) {
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default async function CommunityPage() {
  const user = await getSessionUser();

  let rows: FeedRow[] = [];
  if (dbConfigured) {
    rows = await getDb()
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

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-ink">커뮤니티</h1>
        <p className="mt-2 mb-8 text-sm text-ink/60">
          다른 사람들이 남긴 문장들. 마음에 드는 문장으로 글을 시작해보세요.
        </p>

        {!dbConfigured && (
          <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
            미리보기 모드 — AWS 미연결 상태라 공유된 문장을 불러올 수 없습니다.
          </p>
        )}

        {dbConfigured && rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink/15 px-4 py-12 text-center text-sm text-ink/40">
            아직 공유된 문장이 없어요. 첫 문장을 남겨보세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-ink/10 p-4"
              >
                <p className="text-[15px] leading-relaxed text-ink">{row.text}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-ink/45">
                  <span>
                    {row.nickname ?? "익명"} · {ymd(row.createdAt)}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/article/write?ids=${row.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      이 문장으로 글쓰기
                    </Link>
                    {user && (
                      <form action={reportSentence}>
                        <input type="hidden" name="sentenceId" value={row.id} />
                        <button
                          type="submit"
                          className="text-ink/35 hover:text-brand"
                        >
                          신고
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
