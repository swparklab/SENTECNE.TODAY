import { NextResponse, type NextRequest } from "next/server";
import { authReady, mockMode, ID_COOKIE } from "@/lib/auth/config";

// Edge 런타임. AWS SDK를 들이지 않고 세션 쿠키 존재만 가볍게 확인한다.
export function middleware(request: NextRequest) {
  // mock 모드(로그인 없이 사용) 또는 인증 미연결 시 보호하지 않는다.
  if (mockMode || !authReady) {
    return NextResponse.next();
  }

  const protectedPrefixes = ["/profile", "/sentence", "/article", "/mypage"];
  const isProtected = protectedPrefixes.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  if (isProtected && !request.cookies.get(ID_COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
