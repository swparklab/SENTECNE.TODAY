"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authReady } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/session";
import { dataReady } from "@/db/client";
import { reportAndMaybeHide } from "@/db/repo";

export async function reportSentence(formData: FormData) {
  if (!authReady || !dataReady) {
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

  await reportAndMaybeHide(user.sub, sentenceId);

  revalidatePath("/community");
  redirect("/community?reported=1");
}
