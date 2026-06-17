"use client";

import { useRef, useState } from "react";
import type { Card } from "@/lib/cards";

const INK = "#121212";
const CREAM = "#faf8f3";
const BRAND = "#cc3f3b";

export default function CardNews({
  cards,
  nickname,
}: {
  cards: Card[];
  nickname: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const card = cards[index];
  const total = cards.length;

  async function save() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(ref.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.download = `sentence-today-${index + 1}.png`;
      a.href = url;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 카드 (저장 대상) */}
      <div
        ref={ref}
        className="flex aspect-square w-[340px] flex-col justify-between p-8 sm:w-[420px]"
        style={{
          background: card.kind === "cover" ? INK : card.kind === "end" ? BRAND : CREAM,
          color: card.kind === "body" ? INK : "#ffffff",
        }}
      >
        {/* 상단 */}
        <div className="flex items-center justify-between text-[11px]">
          {card.kind === "cover" ? (
            <span style={{ color: BRAND, letterSpacing: "0.2em" }}>
              SENTENCE.TODAY
            </span>
          ) : (
            <span style={{ opacity: 0.5 }}>
              {card.kind === "body" ? `${index} / ${total - 2}` : ""}
            </span>
          )}
        </div>

        {/* 본문 */}
        <p
          className="font-serif"
          style={{
            fontSize:
              card.kind === "cover" ? "30px" : card.kind === "end" ? "26px" : "22px",
            lineHeight: 1.5,
            fontWeight: card.kind === "body" ? 400 : 700,
            textAlign: card.kind === "body" ? "left" : "center",
          }}
        >
          {card.text}
        </p>

        {/* 하단 */}
        <div className="flex items-center justify-between text-[11px]" style={{ opacity: 0.6 }}>
          <span>sentence.today</span>
          {card.kind !== "end" && nickname && <span>{nickname}</span>}
        </div>
      </div>

      {/* 페이지 인디케이터 */}
      <div className="flex items-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번 카드`}
            onClick={() => setIndex(i)}
            className="size-2 rounded-full transition"
            style={{ background: i === index ? BRAND : "rgba(18,18,18,0.15)" }}
          />
        ))}
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70 transition hover:bg-ink/5 disabled:opacity-30"
        >
          이전
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "저장 중…" : "이미지로 저장"}
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={index === total - 1}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70 transition hover:bg-ink/5 disabled:opacity-30"
        >
          다음
        </button>
      </div>

      <p className="text-xs text-ink/40">
        {index + 1} / {total} 장
      </p>
    </div>
  );
}
