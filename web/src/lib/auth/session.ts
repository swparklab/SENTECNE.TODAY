import "server-only";
import { mockMode, MOCK_USER } from "./config";
import * as cognito from "./cognito";
import type { SessionUser } from "./cognito";

export type { SessionUser };

// mock 모드에서는 로그인 없이 기본 사용자로 동작한다.
// (실제 배포 시 Cognito가 연결되면 자동으로 정상 인증 흐름으로 복귀)
export async function getSessionUser(): Promise<SessionUser | null> {
  if (mockMode) return MOCK_USER;
  return cognito.getSessionUser();
}

export async function signIn(email: string, password: string) {
  if (mockMode) return;
  return cognito.signIn(email, password);
}

export async function signUp(email: string, password: string) {
  if (mockMode) return;
  return cognito.signUp(email, password);
}

export async function signOutSession() {
  if (mockMode) return;
  return cognito.signOutSession();
}
