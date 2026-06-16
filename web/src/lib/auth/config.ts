// AWS / Cognito 설정. 환경변수 미설정 시 preview 모드로 동작한다.
export const awsRegion = process.env.AWS_REGION ?? "ap-northeast-2"; // 서울
export const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID ?? "";
export const cognitoClientId = process.env.COGNITO_CLIENT_ID ?? "";

export const cognitoConfigured = !!cognitoUserPoolId && !!cognitoClientId;

// 세션 쿠키 이름
export const ID_COOKIE = "st_id_token";
export const ACCESS_COOKIE = "st_access_token";
export const REFRESH_COOKIE = "st_refresh_token";
