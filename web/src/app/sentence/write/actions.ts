"use server";

import { redirect } from "next/navigation";
import { cognitoConfigured } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/cognito";
import { dbConfigured, getDb } from "@/db/client";
import { sentences } from "@/db/schema";

type Item = { text: string; selected: boolean };

export async function submitSentences(formData: FormData) {
  if (!cognitoConfigured || !dbConfigured) {
    redirect(
      `/sentence/write?error=${encodeURIComponent("AWS가 연결되지 않아 저장할 수 없습니다 (미리보기 모드)")}`,
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

  const cleaned = parsed
    .map((p) => ({ text: String(p.text ?? "").trim(), selected: !!p.selected }))
    .filter((p) => p.text.length > 0);

  if (cleaned.length === 0) {
    redirect(
      `/sentence/write?error=${encodeURIComponent("문장을 한 개 이상 입력해주세요")}`,
    );
  }

  const rows = cleaned.map((c) => ({
    writerSub: user.sub,
    text: c.text,
    status: (c.selected ? "draft" : "shared") as "draft" | "shared",
  }));

  let selectedIds: number[] = [];
  try {
    const inserted = await getDb()
      .insert(sentences)
      .values(rows)
      .returning({ id: sentences.id, status: sentences.status });
    selectedIds = inserted
      .filter((r) => r.status === "draft")
      .map((r) => r.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장에 실패했습니다.";
    redirect(`/sentence/write?error=${encodeURIComponent(msg)}`);
  }

  // 선택한 문장이 없으면 전부 커뮤니티로 공유된 것
  if (selectedIds.length === 0) {
    redirect("/community?shared=1");
  }

  redirect(`/article/write?ids=${selectedIds.join(",")}`);
}
