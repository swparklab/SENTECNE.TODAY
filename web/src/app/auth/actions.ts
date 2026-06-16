"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

const NOT_CONFIGURED = "Supabase가 아직 연결되지 않았습니다 (web/README.md 참고)";

export async function login(formData: FormData) {
  if (!supabaseConfigured) {
    redirect(`/login?error=${encodeURIComponent(NOT_CONFIGURED)}`);
  }
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  if (!supabaseConfigured) {
    redirect(`/signup?error=${encodeURIComponent(NOT_CONFIGURED)}`);
  }
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // 가입 후 프로필 설정으로. (이메일 확인이 켜져 있으면 확인 후 로그인 필요)
  revalidatePath("/", "layout");
  redirect("/profile/setup");
}

export async function signOut() {
  if (!supabaseConfigured) {
    redirect("/");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
