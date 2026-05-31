import { NextResponse } from "next/server";
import { generateToken, setTokenCookie } from "@/lib/csrf";

export async function GET() {
  const token = generateToken();
  const response = NextResponse.json({ csrfToken: token });
  setTokenCookie(response, token);
  return response;
}
