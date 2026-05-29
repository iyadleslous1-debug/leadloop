import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest) {
  try {
    const { id, ai_active } = await request.json();

    if (!id || typeof ai_active !== "boolean") {
      return NextResponse.json({ error: "id and ai_active required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("conversations")
      .update({ ai_active })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, ai_active });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
