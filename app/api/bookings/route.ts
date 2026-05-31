import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/services/logging";
import { logAuditEvent } from "@/services/audit";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("bookings")
      .select("*, lead:leads(name, phone), property:properties(title)")
      .order("scheduled_at", { ascending: true });

    return NextResponse.json(data || []);
  } catch (err) {
    await logError("bookings/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        lead_id: body.lead_id,
        property_id: body.property_id || null,
        user_id: user.id,
        scheduled_at: body.scheduled_at,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await logAuditEvent(user.id, "booking.created", { bookingId: data.id, leadId: body.lead_id });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    await logError("bookings/post", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
