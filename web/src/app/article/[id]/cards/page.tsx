import Link from "next/link";
import { notFound } from "next/navigation";
import ModeBanner from "@/components/ModeBanner";
import Nav from "@/components/Nav";
import { dataReady } from "@/db/client";
import { getArticle } from "@/db/repo";
import { buildCards } from "@/lib/cards";
import CardNews from "./CardNews";

export default async function CardNewsPage({
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

  const cards = buildCards(article.title, article.body, article.nickname);

  return (
    <>
      <ModeBanner />
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">카드뉴스</h1>
          <Link
            href={`/article/${article.id}`}
            className="text-sm text-ink/50 hover:text-ink"
          >
            ← 글로 돌아가기
          </Link>
        </div>
        <p className="mb-8 text-sm text-ink/60">
          좌우로 넘겨보고, 마음에 드는 카드를 이미지로 저장해 SNS에 공유하세요.
        </p>

        <CardNews cards={cards} nickname={article.nickname} />
      </main>
    </>
  );
}
