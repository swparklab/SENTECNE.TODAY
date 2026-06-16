import "server-only";
import { cookies } from "next/headers";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import {
  awsRegion,
  cognitoClientId,
  cognitoConfigured,
  cognitoUserPoolId,
  ID_COOKIE,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "./config";

export type SessionUser = { sub: string; email: string | null };

let _client: CognitoIdentityProviderClient | null = null;
function client() {
  if (!_client) {
    _client = new CognitoIdentityProviderClient({ region: awsRegion });
  }
  return _client;
}

let _verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;
function verifier() {
  if (!_verifier) {
    _verifier = CognitoJwtVerifier.create({
      userPoolId: cognitoUserPoolId,
      tokenUse: "id",
      clientId: cognitoClientId,
    });
  }
  return _verifier;
}

// 서버 컴포넌트/액션에서 현재 로그인 사용자를 반환. 미로그인/미설정이면 null.
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!cognitoConfigured) return null;

  const store = await cookies();
  const idToken = store.get(ID_COOKIE)?.value;
  if (!idToken) return null;

  try {
    const payload = await verifier().verify(idToken);
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
    };
  } catch {
    return null;
  }
}

// 이메일/비밀번호 로그인 → 토큰을 httpOnly 쿠키로 저장
export async function signIn(email: string, password: string) {
  const res = await client().send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: cognitoClientId,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    }),
  );

  const result = res.AuthenticationResult;
  if (!result?.IdToken || !result.AccessToken) {
    throw new Error("로그인에 실패했습니다.");
  }

  const store = await cookies();
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  store.set(ID_COOKIE, result.IdToken, base);
  store.set(ACCESS_COOKIE, result.AccessToken, base);
  if (result.RefreshToken) {
    store.set(REFRESH_COOKIE, result.RefreshToken, base);
  }
}

// 회원가입 (이메일 인증은 Cognito 설정에 따름)
export async function signUp(email: string, password: string) {
  await client().send(
    new SignUpCommand({
      ClientId: cognitoClientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    }),
  );
}

export async function signOutSession() {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    try {
      await client().send(new GlobalSignOutCommand({ AccessToken: accessToken }));
    } catch {
      // 토큰이 이미 만료된 경우 등은 무시
    }
  }
  store.delete(ID_COOKIE);
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
