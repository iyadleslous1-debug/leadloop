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
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    await logError("properties/get", err);
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
      .from("properties")
      .insert({
        title: body.title,
        price: body.price,
        location: body.location,
        city: body.city,
        type: body.type,
        status: body.status || "for_sale",
        description: body.description || null,
        images: body.images || [],
        video_url: body.video_url || null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent(user.id, "property.created", { propertyId: data.id, title: data.title });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    await logError("properties/post", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
