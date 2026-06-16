"use client";

import { useState } from "react";
import { submitSentences } from "./actions";

type Item = { text: string; selected: boolean };

export default function SentenceComposer() {
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t) return;
    setItems((prev) => [...prev, { text: t, selected: true }]);
    setDraft("");
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggle(idx: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, selected: !it.selected } : it)),
    );
  }

  const selectedCount = items.filter((i) => i.selected).length;
  const sharedCount = items.length - selectedCount;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="문장을 입력하고 Enter"
          className="flex-1 rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          추가
        </button>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 rounded-lg border border-ink/10 px-4 py-3"
            >
              <input
                type="checkbox"
                checked={it.selected}
                onChange={() => toggle(idx)}
                className="size-4 accent-[var(--color-brand)]"
                aria-label="내 글에 사용"
              />
              <span className="flex-1 text-sm text-ink">{it.text}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-ink/40 hover:text-brand"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-ink/50">
        체크한 문장으로 글을 씁니다. 체크하지 않은 문장은 커뮤니티에 공유됩니다.
      </p>

      <form action={submitSentences}>
        <input type="hidden" name="payload" value={JSON.stringify(items)} readOnly />
        <button
          type="submit"
          disabled={items.length === 0}
          className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {items.length === 0
            ? "문장을 추가해주세요"
            : `${selectedCount}개로 글쓰기 · ${sharedCount}개 커뮤니티 공유`}
        </button>
      </form>
    </div>
  );
}
