import ModeBanner from "@/components/ModeBanner";
import Nav from "@/components/Nav";
import { getSessionUser } from "@/lib/auth/session";
import { dataReady } from "@/db/client";
import { getStarterSentences } from "@/db/repo";
import { publish } from "./actions";

export default async function ArticleWritePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; error?: string }>;
}) {
  const { ids: idsParam, error } = await searchParams;

  const ids = (idsParam ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  const user = await getSessionUser();

  const starters =
    user && dataReady && ids.length > 0
      ? await getStarterSentences(user.sub, ids)
      : [];

  const bodyDefault = starters.map((s) => s.text).join("\n\n");

  return (
    <>
      <ModeBanner />
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-ink">글 쓰기</h1>
        <p className="mt-2 mb-8 text-sm text-ink/60">
          고른 문장에서 시작해 한 편의 글로 완성해보세요.
        </p>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-brand">
            {error}
          </p>
        )}

        {starters.length > 0 && (
          <div className="mb-6 rounded-lg border border-ink/10 bg-ink/[0.02] p-4">
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

        <form action={publish} className="space-y-4">
          <input type="hidden" name="ids" value={ids.join(",")} />
          <input
            name="title"
            type="text"
            maxLength={100}
            placeholder="제목 (선택)"
            className="w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <textarea
            name="body"
            rows={14}
            required
            defaultValue={bodyDefault}
            placeholder="이곳에 글을 써내려가세요."
            className="w-full resize-y rounded-lg border border-ink/15 px-4 py-3 text-sm leading-relaxed outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            발행하기
          </button>
        </form>
      </main>
    </>
  );
}
