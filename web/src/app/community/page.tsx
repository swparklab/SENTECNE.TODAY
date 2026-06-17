import Link from "next/link";
import ModeBanner from "@/components/ModeBanner";
import Nav from "@/components/Nav";
import { getSessionUser } from "@/lib/auth/session";
import { dataReady } from "@/db/client";
import { getCommunityArticles, getCommunityFeed } from "@/db/repo";
import { reportSentence } from "./actions";

function ymd(v: unknown) {
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default async function CommunityPage() {
  const user = await getSessionUser();
  const [articles, rows] = dataReady
    ? await Promise.all([getCommunityArticles(), getCommunityFeed()])
    : [[], []];

  return (
    <>
      <ModeBanner />
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-ink">커뮤니티</h1>
        <p className="mt-2 mb-10 text-sm text-ink/60">
          발행된 글과 공유된 문장을 둘러보세요. 마음에 드는 문장으로 글을
          시작해도 좋아요.
        </p>

        {/* 최근 발행된 글 */}
        <section className="mb-12">
          <h2 className="mb-3 text-sm font-semibold text-ink/70">최근 글</h2>
          {articles.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/40">
              아직 발행된 글이 없어요.
            </p>
          ) : (
            <ul className="space-y-2">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/article/${a.id}`}
                    className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3 transition hover:bg-ink/[0.02]"
                  >
                    <span className="text-sm text-ink">{a.title || "무제"}</span>
                    <span className="text-xs text-ink/40">
                      {a.nickname ?? "익명"} · {ymd(a.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 공유된 문장 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink/70">문장</h2>
          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/40">
              아직 공유된 문장이 없어요. 문장 쓰기에서 체크하지 않은 문장이 이곳에
              공유됩니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.id} className="rounded-lg border border-ink/10 p-4">
                  <p className="text-[15px] leading-relaxed text-ink">
                    {row.text}
                  </p>
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
                          <input
                            type="hidden"
                            name="sentenceId"
                            value={row.id}
                          />
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
        </section>
      </main>
    </>
  );
}
