// 워드마크 로고 — 원본 자산 `<오늘:의 문장>` (각괄호 + 콜론, 볼드 세리프).
// 색은 currentColor를 상속하므로 어떤 배경에서도 쓸 수 있다.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="오늘의 문장"
      className={`whitespace-nowrap font-serif font-extrabold leading-none tracking-tight ${className}`}
    >
      &lt;오늘<span className="font-bold">:</span>의&nbsp;문장&gt;
    </span>
  );
}
