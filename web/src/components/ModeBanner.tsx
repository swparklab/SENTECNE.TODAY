import { cognitoConfigured, mockMode } from "@/lib/auth/config";

// 현재 실행 모드를 알려주는 상단 배너.
export default function ModeBanner() {
  if (mockMode) {
    return (
      <div className="bg-sky-50 px-4 py-2 text-center text-xs text-sky-800">
        로컬 테스트 모드 — 로그인 없이 바로 사용 중. 데이터는 메모리에만 있고
        서버 재시작 시 초기화됩니다.
      </div>
    );
  }
  if (!cognitoConfigured) {
    return (
      <div className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        미리보기 모드 — AWS 미연결로 로그인·저장이 동작하지 않습니다.{" "}
        <code className="font-mono">web/README.md</code> 참고
      </div>
    );
  }
  return null;
}
