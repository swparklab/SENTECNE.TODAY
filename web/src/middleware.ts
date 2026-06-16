import { NextResponse, type NextRequest } from "next/server";
import { cognitoConfigured, ID_COOKIE } from "@/lib/auth/config";

// 미들웨어는 Edge 런타임에서 돈다. AWS SDK를 들이지 않고
// 세션 쿠키 존재 여부만 가볍게 확인한다. (실제 검증은 서버 컴포넌트에서)
export function middleware(request: NextRequest) {
  if (!cognitoConfigured) {
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
