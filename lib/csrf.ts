import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TOKEN_COOKIE = "csrf_token";
const TOKEN_HEADER = "x-csrf-token";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function setTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export function getTokenFromCookie(request: NextRequest): string | undefined {
  return request.cookies.get(TOKEN_COOKIE)?.value;
}

export function getTokenFromHeader(request: NextRequest): string | undefined {
  return request.headers.get(TOKEN_HEADER) || undefined;
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    host ? `https://${host}` : undefined,
    host ? `http://${host}` : undefined,
  ].filter(Boolean) as string[];

  if (origin && allowedOrigins.some((o) => origin.startsWith(o))) return true;
  if (referer && allowedOrigins.some((o) => referer.startsWith(o))) return true;

  return false;
}
