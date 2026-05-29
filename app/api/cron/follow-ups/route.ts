import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { data: followUps, error } = await admin
      .from("follow_ups")
      .select("*, lead:leads(id, name, phone)")
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

    const { default: twilio } = await import("twilio");
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    let sent = 0;
    for (const fu of followUps) {
      try {
        const lead = fu.lead as { id: string; name: string; phone: string } | null;
        if (!lead?.phone) {
          console.log("[Cron] No phone for follow-up", fu.id);
          await admin.from("follow_ups").update({ completed: true }).eq("id", fu.id);
          continue;
        }

        // Look up conversation by lead_id
        const { data: conv } = await admin
          .from("conversations")
          .select("id")
          .eq("lead_id", lead.id)
          .maybeSingle();

        // Send via Twilio
        if (accountSid && authToken && from) {
          const client = twilio(accountSid, authToken);
          const twilioMsg = await client.messages.create({
            from: `whatsapp:${from}`,
            to: `whatsapp:${lead.phone}`,
            body: fu.message,
          });
          console.log("[Cron] Sent follow-up", fu.id, "SID:", twilioMsg.sid);
        } else {
          console.log("[Cron] No Twilio creds, would send:", fu.message);
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
        console.error("[Cron] Error processing follow-up", fu.id, err);
      }
    }

    return NextResponse.json({ status: "ok", sent, total: followUps.length });
  } catch (err) {
    console.error("[Cron] Error:", err);
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
