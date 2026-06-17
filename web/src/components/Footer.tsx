import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-ink/[0.02]">
      <div className="mx-auto max-w-3xl px-6 py-14 text-center">
        <p className="font-serif text-xl text-ink">
          오늘<span className="text-brand">:</span>의 문장
        </p>
        <p className="mt-2 text-sm text-ink/50">
          모든 글은 하나의 문장에서 시작된다
        </p>

        <div className="mt-7 flex items-center justify-center gap-5 text-xs text-ink/45">
          <Link href="/community" className="hover:text-ink">
            커뮤니티
          </Link>
          <Link href="/sentence/write" className="hover:text-ink">
            문장 쓰기
          </Link>
          <Link href="/mypage" className="hover:text-ink">
            마이페이지
          </Link>
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-ink/35">
          © 2026 sentence.today · 모든 콘텐츠의 저작권은 작성자에게 있습니다.
        </p>
      </div>
    </footer>
  );
}
