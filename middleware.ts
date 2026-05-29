import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboardPath = pathname.startsWith("/dashboard");

  const accessToken = request.cookies.get("sb-access-token")?.value;

  if (isDashboardPath && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPath && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
