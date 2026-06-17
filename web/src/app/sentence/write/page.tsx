import ModeBanner from "@/components/ModeBanner";
import Nav from "@/components/Nav";
import SentenceComposer from "./SentenceComposer";

export default async function SentenceWritePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <ModeBanner />
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-ink">문장 쓰기</h1>
        <p className="mt-2 mb-8 text-sm text-ink/60">
          떠오르는 문장을 자유롭게 적어보세요. 한 문장이면 충분합니다.
        </p>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-brand">
            {error}
          </p>
        )}

        <SentenceComposer />
      </main>
    </>
  );
}
