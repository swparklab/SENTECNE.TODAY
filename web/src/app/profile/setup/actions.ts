"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nickname = String(formData.get("nickname") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!nickname) {
    redirect("/profile/setup?error=닉네임을 입력해주세요");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      nickname,
      message: message || null,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    // 닉네임 unique 위반 등
    redirect(`/profile/setup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
