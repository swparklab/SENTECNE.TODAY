import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { mockMode } from "@/lib/auth/config";
import { signOut } from "@/app/auth/actions";

export default async function Nav() {
  const user = await getSessionUser();

  return (
    <nav className="flex items-center justify-between border-b border-ink/10 px-6 py-4 text-sm">
      <Link href="/" className="font-bold tracking-tight text-brand">
        sentence.today
      </Link>
      <div className="flex items-center gap-4 text-ink/70">
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
  );
}
