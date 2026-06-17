import Link from "next/link";
import ModeBanner from "@/components/ModeBanner";
import { getSessionUser } from "@/lib/auth/session";
import { mockMode } from "@/lib/auth/config";
import { dataReady } from "@/db/client";
import { getProfileNickname } from "@/db/repo";
import { signOut } from "./auth/actions";

export default async function Home() {
  const user = await getSessionUser();

  let nickname: string | null = null;
  if (user && dataReady) {
    nickname = await getProfileNickname(user.sub);
  }

  return (
    <>
      <ModeBanner />
      <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center gap-10 px-6 text-center">
        <div className="space-y-3">
          <p className="text-sm tracking-widest text-brand">SENTENCE.TODAY</p>
          <h1 className="text-3xl font-bold leading-snug text-ink sm:text-4xl">
            모든 글은
            <br />
            하나의 문장에서 시작된다
          </h1>
        </div>

        {user ? (
          <div className="flex flex-col items-center gap-5">
            <p className="text-ink/70">
              {nickname ? (
                <>
                  <span className="font-semibold text-ink">{nickname}</span>님,
                  오늘의 문장을 시작해볼까요?
                </>
              ) : (
                <>프로필을 먼저 설정해주세요.</>
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={nickname ? "/sentence/write" : "/profile/setup"}
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {nickname ? "문장 쓰기" : "프로필 설정"}
              </Link>
              <Link
                href="/community"
                className="rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink/70 transition hover:bg-ink/5"
              >
                커뮤니티
              </Link>
              {!mockMode && (
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink/70 transition hover:bg-ink/5"
                  >
                    로그아웃
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              시작하기
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink/70 transition hover:bg-ink/5"
            >
              로그인
            </Link>
            <Link
              href="/community"
              className="rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink/70 transition hover:bg-ink/5"
            >
              커뮤니티 둘러보기
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
