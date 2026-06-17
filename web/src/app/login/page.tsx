import Link from "next/link";
import { redirect } from "next/navigation";
import { mockMode } from "@/lib/auth/config";
import { login } from "../auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  // 로컬(mock) 모드에서는 로그인 없이 사용하므로 홈으로
  if (mockMode) redirect("/");

  const { error, notice } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-8 text-2xl font-bold text-ink">로그인</h1>

      {notice && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}

      <form action={login} className="space-y-4">
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
          placeholder="비밀번호"
          className="w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
        />

        {error && <p className="text-sm text-brand">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          로그인
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-brand">
          회원가입
        </Link>
      </p>
    </main>
  );
}
