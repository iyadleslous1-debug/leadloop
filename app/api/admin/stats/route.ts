import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminStats } from "@/services/admin/stats";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "iyadleslous1@gmail.com";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[ADMIN STATS ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
