import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/cognito";
import { dbConfigured, getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { saveProfile } from "./actions";

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  let profile: { nickname: string | null; message: string | null } | null =
    null;

  const user = await getSessionUser();
  if (user && dbConfigured) {
    const rows = await getDb()
      .select({ nickname: profiles.nickname, message: profiles.message })
      .from(profiles)
      .where(eq(profiles.userSub, user.sub))
      .limit(1);
    profile = rows[0] ?? null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-bold text-ink">프로필 설정</h1>
      <p className="mb-8 text-sm text-ink/60">커뮤니티에 표시될 이름이에요.</p>

      <form action={saveProfile} className="space-y-4">
        <input
          name="nickname"
          type="text"
          required
          maxLength={20}
          defaultValue={profile?.nickname ?? ""}
          placeholder="닉네임 (최대 20자)"
          className="w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <textarea
          name="message"
          rows={3}
          maxLength={100}
          defaultValue={profile?.message ?? ""}
          placeholder="한 줄 소개 (선택, 최대 100자)"
          className="w-full resize-none rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
        />

        {error && <p className="text-sm text-brand">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          저장하고 시작하기
        </button>
      </form>
    </main>
  );
}
