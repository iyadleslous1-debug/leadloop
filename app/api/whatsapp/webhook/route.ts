import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/services/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const from = formData.get("From")?.toString() || "";
    const body = formData.get("Body")?.toString() || "";
    const profileName = formData.get("ProfileName")?.toString();

    if (!from || !body) {
      return NextResponse.json({ status: "ignored" });
    }

    const phone = from.replace("whatsapp:", "");
    const result = await processIncomingMessage(phone, profileName || undefined, body);

    return NextResponse.json({ status: "processed", ...result });
  } catch (err) {
    console.error("[Twilio Webhook] Error:", err);
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
