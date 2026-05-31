import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/services/whatsapp";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/services/logging";
import { normalizePhone } from "@/lib/phone";

const TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twimlResponse(status: number) {
  return new NextResponse(TWIML, {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rl = checkRateLimit(`webhook:${ip}`, 20, 60000);
    if (!rl.allowed) {
      return twimlResponse(429);
    }

    const formData = await request.formData();

    const from = formData.get("From")?.toString() || "";
    const to = formData.get("To")?.toString() || "";
    const body = formData.get("Body")?.toString() || "";
    const profileName = formData.get("ProfileName")?.toString();

    if (!from || !body) {
      return twimlResponse(200);
    }

    const phone = normalizePhone(from.replace("whatsapp:", ""));
    const toNumber = normalizePhone(to.replace("whatsapp:", ""));

    // Look up which user owns the Twilio number this message was sent to
    let ownerId: string | undefined;
    if (toNumber) {
      const admin = createAdminClient();
      const { data: integration } = await admin
        .from("integrations")
        .select("user_id")
        .eq("twilio_whatsapp_from", toNumber)
        .maybeSingle();
      ownerId = integration?.user_id;
    }

    const result = await processIncomingMessage(phone, profileName || undefined, body, ownerId);

    return twimlResponse(200);
  } catch (err) {
    await logError("webhook", err, { from: request.headers.get("from") });
    return twimlResponse(500);
  }
}
