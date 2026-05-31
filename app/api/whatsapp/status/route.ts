import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/services/logging";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const messageSid = formData.get("MessageSid")?.toString();
    const messageStatus = formData.get("MessageStatus")?.toString();
    const errorCode = formData.get("ErrorCode")?.toString();
    const errorMessage = formData.get("ErrorMessage")?.toString();
    const to = formData.get("To")?.toString();

    if (!messageSid || !messageStatus) {
      return NextResponse.json({ status: "ignored" });
    }

    const admin = createAdminClient();

    // Update delivery_logs
    const { data: existingLogs } = await admin
      .from("delivery_logs")
      .select("id, conversation_id")
      .eq("message_sid", messageSid)
      .limit(1);

    if (existingLogs && existingLogs.length > 0) {
      await admin
        .from("delivery_logs")
        .update({
          status: messageStatus,
          error_code: errorCode || null,
          error_message: errorMessage || null,
          metadata: { received_at: new Date().toISOString() },
        })
        .eq("id", existingLogs[0].id);
    } else {
      await admin.from("delivery_logs").insert({
        message_sid: messageSid,
        status: messageStatus,
        error_code: errorCode || null,
        error_message: errorMessage || null,
        to_phone: to?.replace("whatsapp:", "") || null,
      });
    }

    if (messageStatus === "failed" || messageStatus === "undelivered") {
      logError("twilio-delivery", new Error(errorMessage || messageStatus), {
        messageSid,
        errorCode,
        status: messageStatus,
      });
    }

    return NextResponse.json({ status: "logged" });
  } catch (err) {
    console.error("[Twilio Status] Error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
