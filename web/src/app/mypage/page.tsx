import Link from "next/link";
import ModeBanner from "@/components/ModeBanner";
import Nav from "@/components/Nav";
import { getSessionUser } from "@/lib/auth/session";
import { authReady } from "@/lib/auth/config";
import { dataReady } from "@/db/client";
import { getMyArticles, getMySentences, getProfileNickname } from "@/db/repo";

function ymd(v: unknown) {
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default async function MyPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <ModeBanner />
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="text-2xl font-bold text-ink">마이페이지</h1>
          <p className="mt-4 text-sm text-ink/60">
            {authReady ? (
              <>
                로그인이 필요합니다.{" "}
                <Link href="/login" className="font-medium text-brand">
                  로그인
                </Link>
              </>
            ) : (
              "미리보기 모드 — 인증이 연결되지 않았습니다."
            )}
          </p>
        </main>
      </>
    );
  }

  const [nickname, myArticles, myShared] = dataReady
    ? await Promise.all([
        getProfileNickname(user.sub),
        getMyArticles(user.sub),
        getMySentences(user.sub),
      ])
    : [null, [], []];

  return (
    <>
      <ModeBanner />
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-3xl font-bold text-ink">
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
                <li key={a.id}>
                  <Link
                    href={`/article/${a.id}`}
                    className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3 text-sm transition hover:bg-ink/[0.02]"
                  >
                    <span className="text-ink">{a.title || "무제"}</span>
                    <span className="text-xs text-ink/40">{ymd(a.createdAt)}</span>
                  </Link>
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
