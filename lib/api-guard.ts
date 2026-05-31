import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

interface GuardOptions {
  rateLimit?: number;
  rateWindowMs?: number;
  requireAuth?: boolean;
}

export async function guardRoute(
  request: NextRequest,
  opts: GuardOptions = {}
): Promise<NextResponse | null> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const path = request.nextUrl.pathname;

  if (opts.rateLimit) {
    const rl = checkRateLimit(`${path}:${ip}`, opts.rateLimit, opts.rateWindowMs || 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (opts.requireAuth !== false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return null;
}
