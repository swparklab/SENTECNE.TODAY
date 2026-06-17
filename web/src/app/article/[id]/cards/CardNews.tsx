"use client";

import { useRef, useState } from "react";
import {
  CARD_THEMES,
  SANS_STACK,
  SERIF_STACK,
  type Card,
} from "@/lib/cards";

export default function CardNews({
  cards,
  nickname,
}: {
  cards: Card[];
  nickname: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [themeId, setThemeId] = useState(CARD_THEMES[0].id);
  const ref = useRef<HTMLDivElement>(null);

  const theme = CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];
  const fontFamily = theme.serif ? SERIF_STACK : SANS_STACK;
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
      {/* 테마 선택 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {CARD_THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setThemeId(t.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              t.id === themeId
                ? "border-brand text-brand"
                : "border-ink/15 text-ink/60 hover:bg-ink/5"
            }`}
          >
            <span
              className="size-3 rounded-full border border-black/10"
              style={{ background: t.bg }}
            />
            {t.label}
          </button>
        ))}
      </div>

      {/* 카드 (저장 대상) */}
      <div
        ref={ref}
        className="flex aspect-square w-[340px] flex-col justify-between p-8 sm:w-[420px]"
        style={{ background: theme.bg, color: theme.fg, fontFamily }}
      >
        <div className="flex items-center justify-between text-[11px]">
          {card.kind === "cover" ? (
            <span style={{ color: theme.accent, letterSpacing: "0.2em" }}>
              SENTENCE.TODAY
            </span>
          ) : (
            <span style={{ opacity: 0.45 }}>
              {card.kind === "body" ? `${index} / ${total - 2}` : ""}
            </span>
          )}
        </div>

        <p
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

        <div
          className="flex items-center justify-between text-[11px]"
          style={{ opacity: 0.55 }}
        >
          <span>sentence.today</span>
          {card.kind !== "end" && nickname && <span>{nickname}</span>}
        </div>
      </div>

      {/* 페이지 점 */}
      <div className="flex items-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번 카드`}
            onClick={() => setIndex(i)}
            className="size-2 rounded-full transition"
            style={{
              background: i === index ? theme.accent : "rgba(120,120,120,0.3)",
            }}
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
