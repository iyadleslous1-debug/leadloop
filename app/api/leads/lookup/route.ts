import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    if (!phone) {
      return NextResponse.json({ error: "phone required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data } = await supabase
      .from("leads")
      .select("name, phone, email, notes")
      .eq("phone", phone)
      .maybeSingle();

    return NextResponse.json(data || {});
  } catch {
    return NextResponse.json({});
  }
}
