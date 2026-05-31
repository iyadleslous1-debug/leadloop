import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkEscalationRules } from "@/services/escalation";
import { logAuditEvent } from "@/services/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const reason = typeof body.reason === "string" ? body.reason : "Manual escalation";

    const admin = createAdminClient();
    const { error } = await admin
      .from("conversations")
      .update({ escalated: true, escalation_reason: reason })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent(user.id, "conversation.escalated", { conversationId: id, reason });

    return NextResponse.json({ escalated: true, reason });
  } catch (err) {
    console.error("[Escalate] Error:", err);
    return NextResponse.json({ error: "Escalation failed" }, { status: 500 });
  }
}
