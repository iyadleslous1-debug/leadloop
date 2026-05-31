import { type NextRequest, NextResponse } from "next/server";
import { validateOrigin, generateToken, setTokenCookie } from "@/lib/csrf";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboardPath = pathname.startsWith("/dashboard");
  const isApiPath = pathname.startsWith("/api");

  const response = NextResponse.next();
  const accessToken = request.cookies.get("sb-access-token")?.value;

  // Log incoming API requests
  if (isApiPath) {
    console.log(JSON.stringify({
      type: "request",
      method: request.method,
      path: pathname,
      timestamp: new Date().toISOString(),
    }));
  }

  // CSRF protection: set token cookie on first visit
  if (!request.cookies.get("csrf_token")) {
    setTokenCookie(response, generateToken());
  }

  // CSRF protection: validate Origin/Referer on mutating API requests
  const isWebhook = pathname.startsWith("/api/whatsapp/webhook");
  if (isApiPath && MUTATING_METHODS.includes(request.method) && !isWebhook) {
    if (!validateOrigin(request)) {
      return new NextResponse(JSON.stringify({ error: "CSRF validation failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Redirect to login if no token
  if (isDashboardPath && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check JWT expiry for dashboard access
  if (isDashboardPath && accessToken && isTokenExpired(accessToken)) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
    res.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
    return res;
  }

  // Redirect to dashboard if already authenticated
  if (isAuthPath && accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/:path*",
  ],
};
