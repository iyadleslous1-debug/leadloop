import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/services/whatsapp";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message are required" }, { status: 400 });
    }

    // Get the authenticated user's ID
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;

    console.log("[SIMULATE] Authenticated as:", ownerId);

    const result = await processIncomingMessage(phone, name || "Test User", message, ownerId);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Simulate] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
