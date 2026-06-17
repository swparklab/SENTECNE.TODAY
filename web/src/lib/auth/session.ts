import "server-only";
import { cookies } from "next/headers";
import { mockMode, MOCK_COOKIE } from "./config";
import * as cognito from "./cognito";
import type { SessionUser } from "./cognito";

export type { SessionUser };

// 현재 로그인 사용자 (mock 또는 Cognito)
export async function getSessionUser(): Promise<SessionUser | null> {
  if (mockMode) {
    const store = await cookies();
    const raw = store.get(MOCK_COOKIE)?.value;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }
  return cognito.getSessionUser();
}

export async function signIn(email: string, password: string) {
  if (mockMode) {
    await setMockSession(email);
    return;
  }
  return cognito.signIn(email, password);
}

export async function signUp(email: string, password: string) {
  if (mockMode) {
    // mock에서는 가입 즉시 로그인 처리
    await setMockSession(email);
    return;
  }
  return cognito.signUp(email, password);
}

export async function signOutSession() {
  if (mockMode) {
    (await cookies()).delete(MOCK_COOKIE);
    return;
  }
  return cognito.signOutSession();
}

async function setMockSession(email: string) {
  const store = await cookies();
  const normalized = email.trim().toLowerCase() || "tester@local";
  const user: SessionUser = { sub: `mock-${normalized}`, email: normalized };
  store.set(MOCK_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
