import ModeBanner from "@/components/ModeBanner";
import Nav from "@/components/Nav";
import { getSessionUser } from "@/lib/auth/session";
import { dataReady } from "@/db/client";
import { getStarterSentences } from "@/db/repo";
import { llmConfigured } from "@/lib/llm/claude";
import ArticleEditor from "./ArticleEditor";

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
          고른 문장에서 시작해 한 편의 글로 완성해보세요. 막히면 도우미를
          불러도 좋아요.
        </p>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-brand">
            {error}
          </p>
        )}

        <ArticleEditor
          ids={ids}
          starters={starters}
          bodyDefault={bodyDefault}
          llmConfigured={llmConfigured}
        />
      </main>
    </>
  );
}
