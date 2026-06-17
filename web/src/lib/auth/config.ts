// AWS / Cognito 설정. 환경변수 미설정 시 preview 모드로 동작한다.
export const awsRegion = process.env.AWS_REGION ?? "ap-northeast-2"; // 서울
export const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID ?? "";
export const cognitoClientId = process.env.COGNITO_CLIENT_ID ?? "";

export const cognitoConfigured = !!cognitoUserPoolId && !!cognitoClientId;

// 로컬 테스트(mock) 모드: AWS 미연결 + 개발 환경일 때만 활성화.
// 가짜 로그인 + 인메모리 저장으로 전체 흐름을 클릭 테스트할 수 있다.
// (프로덕션 빌드에서는 절대 켜지지 않음)
export const mockMode =
  !cognitoConfigured && process.env.NODE_ENV !== "production";

// 인증이 동작 가능한 상태인가 (실제 Cognito 또는 mock)
export const authReady = cognitoConfigured || mockMode;

// mock 모드의 기본 사용자 (로그인 없이 자동 로그인 상태로 취급)
export const MOCK_USER = { sub: "local-user", email: "local@sentence.today" };

// 세션 쿠키 이름
export const ID_COOKIE = "st_id_token";
export const ACCESS_COOKIE = "st_access_token";
export const REFRESH_COOKIE = "st_refresh_token";
export const MOCK_COOKIE = "st_mock_user";
