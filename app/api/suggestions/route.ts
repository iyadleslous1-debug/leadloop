import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/services/whatsapp";
import { logError } from "@/services/logging";
import { logAuditEvent } from "@/services/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, action } = body;
    if (!conversationId || !action) {
      return NextResponse.json({ error: "conversationId and action are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: conv } = await admin
      .from("conversations")
      .select("pending_suggestion, pending_suggestion_media, phone, owner_id, id")
      .eq("id", conversationId)
      .single();

    if (!conv?.pending_suggestion) {
      return NextResponse.json({ error: "No pending suggestion" }, { status: 400 });
    }

    const mediaUrls: string[] | undefined = conv.pending_suggestion_media;

    await logAuditEvent(user.id, action === "send" ? "suggestion.sent" : "suggestion.discarded", {
      conversationId,
      textLength: conv.pending_suggestion.length,
      mediaCount: mediaUrls?.length || 0,
    });

    if (action === "send") {
      await sendWhatsAppMessage(conv.phone, conv.pending_suggestion, conv.owner_id || undefined, conv.id, mediaUrls);

      await admin.from("messages").insert({
        conversation_id: conv.id,
        role: "assistant",
        content: conv.pending_suggestion,
        metadata: { agent_approved: true, media: mediaUrls || [] },
      });
    }

    await admin
      .from("conversations")
      .update({ pending_suggestion: null, pending_suggestion_media: null, last_message_at: new Date().toISOString() })
      .eq("id", conv.id);

    return NextResponse.json({ success: true, action });
  } catch (err) {
    await logError("suggestions/post", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
