import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadTwilioCreds, sendWhatsAppMessage } from "@/services/whatsapp";
import { logError } from "@/services/logging";

export async function POST(request: NextRequest) {
  let conversationId = "unknown";
  try {
    const body = await request.json();
    conversationId = body.conversationId || conversationId;
    const { text } = body;
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

    // Send via Twilio using the authenticated user's creds
    if (conversation.phone) {
      const creds = await loadTwilioCreds(user.id);
      if (creds) {
        await sendWhatsAppMessage(conversation.phone, text, user.id, conversationId);
      } else {
        console.log("[Send] No Twilio creds for user. Would send:", text);
      }
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
    await logError("messages/send", err, { conversationId });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
