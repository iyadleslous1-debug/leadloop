import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/services/logging";

export async function GET() {
  try {
    const admin = createAdminClient();
    const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from("properties")
      .update({ status: "archived" })
      .in("status", ["sold", "rented"])
      .lt("updated_at", cutoff)
      .select();

    if (error) {
      console.error("[Cron] Properties lifecycle error:", error);
      return NextResponse.json({ status: "error", error }, { status: 500 });
    }

    const count = data?.length || 0;
    console.log(`[Cron] Archived ${count} sold/rented properties older than 6 months`);
    return NextResponse.json({ status: "ok", archived: count });
  } catch (err) {
    await logError("cron/properties-lifecycle", err);
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
