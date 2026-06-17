import Link from "next/link";
import { notFound } from "next/navigation";
import ModeBanner from "@/components/ModeBanner";
import Nav from "@/components/Nav";
import { dataReady } from "@/db/client";
import { getArticle } from "@/db/repo";

function ymd(v: unknown) {
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = Number(id);

  const article =
    dataReady && Number.isFinite(articleId)
      ? await getArticle(articleId)
      : null;

  if (!article) notFound();

  return (
    <>
      <ModeBanner />
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="text-xs text-ink/45">
            {article.nickname ?? "익명"} · {ymd(article.createdAt)}
          </p>
          <Link
            href={`/article/${article.id}/cards`}
            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            카드뉴스 만들기
          </Link>
        </div>

        <h1 className="font-serif text-3xl font-bold leading-snug text-ink">
          {article.title || "무제"}
        </h1>

        <article className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/85">
          {article.body}
        </article>

        <div className="mt-10">
          <Link href="/mypage" className="text-sm text-ink/50 hover:text-ink">
            ← 마이페이지
          </Link>
        </div>
      </main>
    </>
  );
}
