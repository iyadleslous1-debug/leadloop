import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/services/whatsapp";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/services/logging";

export async function POST(request: NextRequest) {
  let phone = "unknown";
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rl = checkRateLimit(`simulate:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    phone = body?.phone || phone;
    const { name, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;

    const result = await processIncomingMessage(phone, name || "Test User", message, ownerId);

    return NextResponse.json(result);
  } catch (err) {
    await logError("simulate", err, { phone });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
