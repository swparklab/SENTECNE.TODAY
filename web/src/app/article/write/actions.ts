"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authReady } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/session";
import { dataReady } from "@/db/client";
import { publishArticle, getStarterSentences } from "@/db/repo";
import { getWritingHelp, type HelpMode } from "@/lib/llm/claude";

export async function publish(formData: FormData) {
  if (!authReady || !dataReady) {
    redirect(
      `/article/write?error=${encodeURIComponent("저장소가 연결되지 않았습니다")}`,
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
    await publishArticle(user.sub, {
      title: title || null,
      body,
      sourceIds: ids,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "발행에 실패했습니다.";
    redirect(`/article/write?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/mypage");
  redirect("/mypage");
}

// 글쓰기 보조: 이어쓸 문장 제안 또는 막혔을 때의 질문을 돌려준다.
export async function requestWritingHelp(input: {
  mode: HelpMode;
  title: string;
  body: string;
  ids: number[];
}): Promise<{ items: string[] }> {
  let starters: string[] = [];
  if (dataReady && Array.isArray(input.ids) && input.ids.length > 0) {
    const user = await getSessionUser();
    if (user) {
      const rows = await getStarterSentences(user.sub, input.ids);
      starters = rows.map((s) => s.text);
    }
  }

  const items = await getWritingHelp(input.mode, {
    title: String(input.title ?? ""),
    body: String(input.body ?? ""),
    starters,
  });

  return { items };
}
