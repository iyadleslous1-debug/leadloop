import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/services/logging";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json(data || []);
  } catch (err) {
    await logError("logs/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
