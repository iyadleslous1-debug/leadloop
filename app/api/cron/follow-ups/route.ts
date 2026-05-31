import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTwilioCreds, sendWhatsAppMessage } from "@/services/whatsapp";
import { logError } from "@/services/logging";

export async function GET() {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const minLastMessage = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: followUps, error } = await admin
      .from("follow_ups")
      .select("*, lead:leads(id, name, phone, user_id, follow_ups_paused)")
      .eq("completed", false)
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[Cron] Fetch error:", error);
      return NextResponse.json({ status: "error", error }, { status: 500 });
    }

    if (!followUps || followUps.length === 0) {
      return NextResponse.json({ status: "ok", sent: 0 });
    }

    let sent = 0;
    for (const fu of followUps) {
      try {
        const lead = fu.lead as { id: string; name: string; phone: string; user_id: string; follow_ups_paused: boolean } | null;
        if (!lead?.phone) {
          console.log("[Cron] No phone for follow-up", fu.id);
          await admin.from("follow_ups").update({ completed: true }).eq("id", fu.id);
          continue;
        }

        if (lead.follow_ups_paused) {
          console.log("[Cron] Follow-ups paused for lead", lead.id, "- skipping");
          continue;
        }

        // Look up conversation by lead_id
        const { data: conv } = await admin
          .from("conversations")
          .select("id")
          .eq("lead_id", lead.id)
          .maybeSingle();

        // Throttle: skip if last message from us was < 24h ago
        if (conv?.id) {
          const { data: lastMsg } = await admin
            .from("messages")
            .select("created_at")
            .eq("conversation_id", conv.id)
            .eq("role", "assistant")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (lastMsg && lastMsg.created_at >= minLastMessage) {
            console.log("[Cron] Throttle: last message within 24h for lead", lead.id, "- skipping");
            continue;
          }
        }

        // Send via Twilio using lead owner's creds
        const creds = await loadTwilioCreds(lead.user_id);
        if (creds) {
          await sendWhatsAppMessage(lead.phone, fu.message, lead.user_id, conv?.id);
          console.log("[Cron] Sent follow-up", fu.id);
        } else {
          console.log("[Cron] No Twilio creds for user", lead.user_id, "would send:", fu.message);
        }

        // Store message in conversation if we have it
        if (conv?.id) {
          await admin.from("messages").insert({
            conversation_id: conv.id,
            role: "assistant",
            content: fu.message,
            metadata: { follow_up_id: fu.id, type: fu.type },
          });
        }

        // Mark completed
        await admin.from("follow_ups").update({ completed: true }).eq("id", fu.id);
        sent++;
      } catch (err) {
        await logError("cron/follow-ups-process", err, { followUpId: fu.id });
      }
    }

    return NextResponse.json({ status: "ok", sent, total: followUps.length });
  } catch (err) {
    await logError("cron/follow-ups", err);
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
