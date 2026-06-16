"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { cognitoConfigured } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/cognito";
import { dbConfigured, getDb } from "@/db/client";
import { articles, sentences, sentenceUsages } from "@/db/schema";

export async function publishArticle(formData: FormData) {
  if (!cognitoConfigured || !dbConfigured) {
    redirect(
      `/article/write?error=${encodeURIComponent("AWS가 연결되지 않아 발행할 수 없습니다 (미리보기 모드)")}`,
    );
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!body) {
    const q = ids.length ? `?ids=${ids.join(",")}&` : "?";
    redirect(`/article/write${q}error=${encodeURIComponent("내용을 입력해주세요")}`);
  }

  try {
    const db = getDb();
    const [article] = await db
      .insert(articles)
      .values({
        writerSub: user.sub,
        title: title || null,
        body,
        sourceSentenceIds: ids,
      })
      .returning({ id: articles.id });

    if (ids.length > 0) {
      // 내가 쓴 출발 문장은 'used'로 (커뮤니티 인용 문장은 'shared' 유지)
      await db
        .update(sentences)
        .set({ status: "used" })
        .where(
          and(inArray(sentences.id, ids), eq(sentences.writerSub, user.sub)),
        );

      // 문장 순환 기록
      await db.insert(sentenceUsages).values(
        ids.map((sid) => ({
          sentenceId: sid,
          usedInArticleId: article.id,
          usedBySub: user.sub,
        })),
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "발행에 실패했습니다.";
    redirect(`/article/write?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/mypage");
  redirect("/mypage");
}
