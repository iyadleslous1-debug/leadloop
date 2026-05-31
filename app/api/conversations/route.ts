import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/services/logging";
import { logAuditEvent } from "@/services/audit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id param" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("conversations")
      .select("pending_suggestion, pending_suggestion_media")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    await logError("conversations/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let id = "unknown";
  try {
    const body = await request.json();
    id = body.id || id;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: conv } = await admin
      .from("conversations")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (conv?.owner_id && conv.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.ai_active === "boolean") updates.ai_active = body.ai_active;
    if (typeof body.notes === "string") updates.notes = body.notes;
    if (typeof body.starred === "boolean") updates.starred = body.starred;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { error } = await admin
      .from("conversations")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    if ("ai_active" in updates) {
      await logAuditEvent(user.id, "ai.toggled", { conversationId: id, aiActive: updates.ai_active });
    } else {
      await logAuditEvent(user.id, "conversation.updated", { conversationId: id, fields: Object.keys(updates) });
    }

    return NextResponse.json({ success: true, ...updates });
  } catch (err) {
    await logError("conversations/patch", err, { id });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
