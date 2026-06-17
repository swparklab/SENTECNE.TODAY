import Link from "next/link";
import { redirect } from "next/navigation";
import { mockMode } from "@/lib/auth/config";
import { signup } from "../auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // 로컬(mock) 모드에서는 회원가입 없이 사용하므로 홈으로
  if (mockMode) redirect("/");

  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-bold text-ink">시작하기</h1>
      <p className="mb-8 text-sm text-ink/60">
        한 문장이면 충분합니다.
      </p>

      <form action={signup} className="space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="이메일"
          className="w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
        />

        {error && <p className="text-sm text-brand">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          회원가입
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-brand">
          로그인
        </Link>
      </p>
    </main>
  );
}
