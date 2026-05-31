import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import twilio from "twilio";
import { logError } from "@/services/logging";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("integrations")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Disconnected" });
  } catch (err) {
    await logError("integrations/delete", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("integrations")
      .select("twilio_account_sid, twilio_whatsapp_from")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ integration: data || null });
  } catch (err) {
    await logError("integrations/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { twilio_account_sid, twilio_auth_token, twilio_whatsapp_from } = body;

    if (!twilio_account_sid || !twilio_auth_token || !twilio_whatsapp_from) {
      return NextResponse.json({ error: "All Twilio fields are required" }, { status: 400 });
    }

    // Validate creds by calling Twilio API to list account
    let client: ReturnType<typeof twilio>;
    try {
      client = twilio(twilio_account_sid, twilio_auth_token);
      await client.api.accounts(twilio_account_sid).fetch();
    } catch {
      return NextResponse.json({ error: "Invalid Twilio credentials — check your Account SID and Auth Token" }, { status: 400 });
    }

    // Auto-configure webhook on their Twilio number
    const origin = request.headers.get("origin") || request.nextUrl.origin || "https://leadloop.vercel.app";
    const webhookUrl = `${origin}/api/whatsapp/webhook`;
    let webhookConfigured = false;

    try {
      // Try setting webhook on incoming phone numbers
      const numbers = await client.incomingPhoneNumbers.list({ limit: 20 });
      for (const num of numbers) {
        await client.incomingPhoneNumbers(num.sid).update({
          smsUrl: webhookUrl,
        });
        webhookConfigured = true;
        break;
      }

      // If no phone numbers found, try messaging services
      if (!webhookConfigured) {
        const services = await client.messaging.services.list({ limit: 20 });
        for (const svc of services) {
          await client.messaging.services(svc.sid).update({
            inboundRequestUrl: webhookUrl,
          });
          webhookConfigured = true;
          break;
        }
      }
    } catch {
      console.log("[Twilio] Auto webhook config failed — user may need to set manually");
    }

    // Upsert integration
    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from("integrations")
      .upsert({
        user_id: user.id,
        provider: "twilio",
        twilio_account_sid,
        twilio_auth_token,
        twilio_whatsapp_from,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("[Integrations] Upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save integration" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      webhookConfigured,
      webhookUrl,
      message: webhookConfigured
        ? "Connected! Webhook auto-configured."
        : "Connected! Set this webhook URL in Twilio Console: " + webhookUrl,
    });
  } catch (err) {
    await logError("integrations/post", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
