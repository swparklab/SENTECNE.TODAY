"use server";

import { redirect } from "next/navigation";
import { authReady } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/session";
import { dataReady } from "@/db/client";
import { createSentences } from "@/db/repo";

type Item = { text: string; selected: boolean };

export async function submitSentences(formData: FormData) {
  if (!authReady || !dataReady) {
    redirect(
      `/sentence/write?error=${encodeURIComponent("저장소가 연결되지 않았습니다")}`,
    );
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  let parsed: Item[] = [];
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? "[]"));
  } catch {
    parsed = [];
  }

  if (!Array.isArray(parsed) || parsed.every((p) => !String(p?.text ?? "").trim())) {
    redirect(
      `/sentence/write?error=${encodeURIComponent("문장을 한 개 이상 입력해주세요")}`,
    );
  }

  let selectedIds: number[] = [];
  try {
    const result = await createSentences(
      user.sub,
      parsed.map((p) => ({ text: String(p.text ?? ""), selected: !!p.selected })),
    );
    selectedIds = result.selectedIds;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장에 실패했습니다.";
    redirect(`/sentence/write?error=${encodeURIComponent(msg)}`);
  }

  if (selectedIds.length === 0) {
    redirect("/community?shared=1");
  }

  redirect(`/article/write?ids=${selectedIds.join(",")}`);
}
