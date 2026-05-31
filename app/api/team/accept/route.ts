import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/services/logging";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { token } = body;
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("team_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (!invite) return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });

    if (new Date(invite.expires_at) < new Date()) {
      await admin.from("team_invites").update({ status: "expired" }).eq("id", invite.id);
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    await admin.from("profiles").update({
      role: invite.role,
      agency_id: invite.agency_id,
    }).eq("id", user.id);

    await admin.from("team_invites").update({ status: "accepted" }).eq("id", invite.id);

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    await logError("team/accept", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
