import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "./auth/actions";

export default async function Home() {
  let user: { id: string } | null = null;
  let nickname: string | null = null;

  if (supabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", user.id)
        .maybeSingle();
      nickname = data?.nickname ?? null;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-10 px-6 text-center">
      {!supabaseConfigured && (
        <div className="fixed inset-x-0 top-0 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          미리보기 모드 — Supabase가 연결되지 않아 로그인/저장은 동작하지 않습니다.{" "}
          <code className="font-mono">web/README.md</code> 참고
        </div>
      )}
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
            {nickname ? (
              <Link
                href="/sentence/write"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                문장 쓰기
              </Link>
            ) : (
              <Link
                href="/profile/setup"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                프로필 설정
              </Link>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink/70 transition hover:bg-ink/5"
              >
                로그아웃
              </button>
            </form>
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
        </div>
      )}
    </main>
  );
}
