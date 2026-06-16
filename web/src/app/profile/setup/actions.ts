"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/cognito";
import { dbConfigured, getDb } from "@/db/client";
import { profiles } from "@/db/schema";

export async function saveProfile(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (!dbConfigured) {
    redirect(
      `/profile/setup?error=${encodeURIComponent("DB가 연결되지 않았습니다")}`,
    );
  }

  const nickname = String(formData.get("nickname") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!nickname) {
    redirect(
      `/profile/setup?error=${encodeURIComponent("닉네임을 입력해주세요")}`,
    );
  }

  try {
    await getDb()
      .insert(profiles)
      .values({ userSub: user.sub, nickname, message: message || null })
      .onConflictDoUpdate({
        target: profiles.userSub,
        set: { nickname, message: message || null },
      });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장에 실패했습니다.";
    redirect(`/profile/setup?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
