import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/services/logging";
import { logAuditEvent } from "@/services/audit";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    await logError("leads/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        status: body.status || "cold",
        source: body.source || "manual",
        notes: body.notes || null,
        tags: body.tags || null,
        assigned_to: body.assigned_to || null,
        reminder_at: body.reminder_at || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent(user.id, "lead.created", { leadId: data.id, name: data.name });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    await logError("leads/post", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
