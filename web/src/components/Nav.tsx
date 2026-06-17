import Link from "next/link";
import Logo from "@/components/Logo";
import { getSessionUser } from "@/lib/auth/session";
import { mockMode } from "@/lib/auth/config";
import { signOut } from "@/app/auth/actions";

export default async function Nav() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-[var(--background)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-ink">
          <Logo className="text-lg" />
        </Link>
        <div className="flex items-center gap-5 text-sm text-ink/65">
          <Link href="/community" className="hover:text-ink">
            커뮤니티
          </Link>
          {user ? (
            <>
              <Link href="/sentence/write" className="hover:text-ink">
                문장 쓰기
              </Link>
              <Link href="/mypage" className="hover:text-ink">
                마이페이지
              </Link>
              {!mockMode && (
                <form action={signOut}>
                  <button type="submit" className="hover:text-ink">
                    로그아웃
                  </button>
                </form>
              )}
            </>
          ) : (
            <Link href="/login" className="hover:text-ink">
              로그인
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
