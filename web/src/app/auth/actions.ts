"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cognitoConfigured } from "@/lib/auth/config";
import { signIn, signUp, signOutSession } from "@/lib/auth/cognito";

const NOT_CONFIGURED = "AWS Cognito가 아직 연결되지 않았습니다 (web/README.md 참고)";

export async function login(formData: FormData) {
  if (!cognitoConfigured) {
    redirect(`/login?error=${encodeURIComponent(NOT_CONFIGURED)}`);
  }

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  try {
    await signIn(email, password);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "로그인에 실패했습니다.";
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  if (!cognitoConfigured) {
    redirect(`/signup?error=${encodeURIComponent(NOT_CONFIGURED)}`);
  }

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  try {
    await signUp(email, password);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "회원가입에 실패했습니다.";
    redirect(`/signup?error=${encodeURIComponent(msg)}`);
  }

  redirect(
    `/login?notice=${encodeURIComponent(
      "가입이 접수되었습니다. 이메일 인증 후 로그인해 주세요.",
    )}`,
  );
}

export async function signOut() {
  if (cognitoConfigured) {
    await signOutSession();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
