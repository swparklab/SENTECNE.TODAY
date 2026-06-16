// Supabase 환경변수가 모두 설정되었는지 여부.
// 미설정이면 앱을 비로그인 상태로 graceful하게 동작시켜
// 로컬에서 키 없이도 UI를 볼 수 있게 한다.
export const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
