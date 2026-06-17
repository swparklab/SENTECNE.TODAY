"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { dataReady } from "@/db/client";
import { upsertProfile } from "@/db/repo";

export async function saveProfile(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (!dataReady) {
    redirect(
      `/profile/setup?error=${encodeURIComponent("저장소가 연결되지 않았습니다")}`,
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
    await upsertProfile(user.sub, nickname, message || null);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장에 실패했습니다.";
    redirect(`/profile/setup?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
