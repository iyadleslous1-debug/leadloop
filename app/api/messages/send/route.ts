import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import twilio from "twilio";

export async function POST(request: NextRequest) {
  try {
    const { conversationId, text } = await request.json();
    if (!conversationId || !text) {
      return NextResponse.json({ error: "conversationId and text are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get conversation to find the lead's phone
    const { data: conversation } = await admin
      .from("conversations")
      .select("phone, owner_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.owner_id && conversation.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Send via Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (accountSid && authToken && from && conversation.phone) {
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${conversation.phone}`,
        body: text,
      });
    } else {
      console.log("[Send] No Twilio creds or no phone. Would send:", text);
    }

    // Store message
    await admin.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: text,
      metadata: {},
    });

    // Update timestamp
    await admin
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json({ status: "sent" });
  } catch (err) {
    console.error("[Send Message] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
