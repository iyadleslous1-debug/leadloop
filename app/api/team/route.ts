import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/services/logging";
import { logAuditEvent } from "@/services/audit";
import crypto from "crypto";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, agency_id, id")
      .eq("id", user.id)
      .single();

    if (!profile || !["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const agencyId = profile.agency_id || profile.id;

    const [members, invites] = await Promise.all([
      supabase.from("profiles").select("id, name, email, role, created_at").eq("agency_id", agencyId),
      supabase.from("team_invites").select("*").eq("agency_id", agencyId).eq("status", "pending"),
    ]);

    return NextResponse.json({
      members: members.data || [],
      invites: invites.data || [],
      agencyId,
    });
  } catch (err) {
    await logError("team/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, agency_id, id")
      .eq("id", user.id)
      .single();

    if (!profile || !["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "email and role required" }, { status: 400 });
    }

    if (!["admin", "agent", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const admin = createAdminClient();
    const agencyId = profile.agency_id || profile.id;
    const token = crypto.randomBytes(32).toString("hex");

    const { data: invite, error } = await admin
      .from("team_invites")
      .insert({
        agency_id: agencyId,
        invited_by: user.id,
        email,
        role,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent(user.id, "team.invite", { email, role, inviteId: invite.id });

    return NextResponse.json(invite, { status: 201 });
  } catch (err) {
    await logError("team/post", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "owner") {
      return NextResponse.json({ error: "Only owner can remove members" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ agency_id: null, role: "owner" })
      .eq("id", memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent(user.id, "team.remove", { removedUserId: memberId });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    await logError("team/delete", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
