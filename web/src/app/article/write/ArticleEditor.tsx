"use client";

import { useState, useTransition } from "react";
import { publish, requestWritingHelp } from "./actions";

type Starter = { id: number; text: string };

export default function ArticleEditor({
  ids,
  starters,
  bodyDefault,
  llmConfigured,
}: {
  ids: number[];
  starters: Starter[];
  bodyDefault: string;
  llmConfigured: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(bodyDefault);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [active, setActive] = useState<"continue" | "questions" | null>(null);
  const [pending, startTransition] = useTransition();

  function ask(mode: "continue" | "questions") {
    setActive(mode);
    startTransition(async () => {
      const res = await requestWritingHelp({ mode, title, body, ids });
      if (mode === "continue") setSuggestions(res.items);
      else setQuestions(res.items);
    });
  }

  function appendSentence(s: string) {
    setBody((prev) => (prev.trim() ? `${prev.trim()} ${s}` : s));
  }

  return (
    <form action={publish} className="space-y-4">
      <input type="hidden" name="ids" value={ids.join(",")} />

      {starters.length > 0 && (
        <div className="rounded-lg border border-ink/10 bg-ink/[0.02] p-4">
          <p className="mb-2 text-xs font-medium text-ink/50">출발 문장</p>
          <ul className="space-y-1">
            {starters.map((s) => (
              <li key={s.id} className="text-sm text-ink/80">
                · {s.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <input
        name="title"
        type="text"
        maxLength={100}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 (선택)"
        className="w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
      />

      <textarea
        name="body"
        rows={14}
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="이곳에 글을 써내려가세요."
        className="w-full resize-y rounded-lg border border-ink/15 px-4 py-3 text-sm leading-relaxed outline-none focus:border-brand"
      />

      {/* 글쓰기 도우미 — 대신 써주지 않고 거든다 */}
      <div className="rounded-lg border border-brand/20 bg-brand/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-brand">✦ 글쓰기 도우미</span>
          <button
            type="button"
            onClick={() => ask("continue")}
            disabled={pending}
            className="rounded-full border border-brand/30 px-3 py-1.5 text-xs text-brand transition hover:bg-brand/10 disabled:opacity-50"
          >
            이어쓸 문장 제안
          </button>
          <button
            type="button"
            onClick={() => ask("questions")}
            disabled={pending}
            className="rounded-full border border-brand/30 px-3 py-1.5 text-xs text-brand transition hover:bg-brand/10 disabled:opacity-50"
          >
            막혔어요, 질문 주세요
          </button>
          {pending && <span className="text-xs text-ink/40">생각 중…</span>}
        </div>

        {!llmConfigured && (
          <p className="mt-2 text-[11px] text-ink/40">
            샘플 제안입니다. ANTHROPIC_API_KEY 연결 시 실제 AI 제안이 나옵니다.
          </p>
        )}

        {active === "continue" && suggestions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => appendSentence(s)}
                  className="shrink-0 rounded border border-ink/15 px-2 py-0.5 text-[11px] text-ink/60 transition hover:bg-ink/5"
                >
                  + 넣기
                </button>
                <span className="text-sm text-ink/80">{s}</span>
              </li>
            ))}
          </ul>
        )}

        {active === "questions" && questions.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {questions.map((q, i) => (
              <li key={i} className="text-sm text-ink/70">
                · {q}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        발행하기
      </button>
    </form>
  );
}
