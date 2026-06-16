"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { cognitoConfigured } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/cognito";
import { dbConfigured, getDb } from "@/db/client";
import { reports, sentences } from "@/db/schema";

const HIDE_THRESHOLD = 3;

export async function reportSentence(formData: FormData) {
  if (!cognitoConfigured || !dbConfigured) {
    redirect("/community");
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const sentenceId = Number(formData.get("sentenceId"));
  if (!Number.isFinite(sentenceId) || sentenceId <= 0) {
    redirect("/community");
  }

  const db = getDb();
  await db.insert(reports).values({
    sentenceId,
    reporterSub: user.sub,
    reason: "user_report",
  });

  // 1차 모더레이션: 신고 누적 시 자동 숨김
  const [{ c }] = await db
    .select({ c: count() })
    .from(reports)
    .where(eq(reports.sentenceId, sentenceId));

  if (Number(c) >= HIDE_THRESHOLD) {
    await db
      .update(sentences)
      .set({ isHidden: true })
      .where(eq(sentences.id, sentenceId));
  }

  revalidatePath("/community");
  redirect(`/community?reported=1`);
}
