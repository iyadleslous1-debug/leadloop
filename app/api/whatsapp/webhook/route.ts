import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/services/whatsapp";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "leadloop-verify-2024";

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages?.[0]) {
      return NextResponse.json({ status: "ok" });
    }

    const msg = value.messages[0];
    const contact = value.contacts?.[0];

    if (msg.type !== "text") {
      return NextResponse.json({ status: "ignored" });
    }

    const phone = msg.from;
    const name = contact?.profile?.name;
    const text = msg.text.body;

    const result = await processIncomingMessage(phone, name, text);

    return NextResponse.json({ status: "processed", ...result });
  } catch (err) {
    console.error("[WhatsApp Webhook] Error:", err);
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
