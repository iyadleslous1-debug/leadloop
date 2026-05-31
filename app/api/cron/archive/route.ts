import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/services/logging";

export const dynamic = "force-dynamic";

export async function GET() {
  const authHeader = process.env.CRON_SECRET;
  if (authHeader && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const { data: oldConvs, error: fetchError } = await admin
      .from("conversations")
      .select("id")
      .eq("status", "active")
      .lt("last_message_at", cutoff.toISOString())
      .limit(500);

    if (fetchError) throw fetchError;
    if (!oldConvs || oldConvs.length === 0) {
      return NextResponse.json({ archived: 0, message: "No conversations to archive" });
    }

    const ids = oldConvs.map((c) => c.id);

    const { error: updateError } = await admin
      .from("conversations")
      .update({ status: "archived" })
      .in("id", ids);

    if (updateError) throw updateError;

    console.log(`[Cron Archive] Archived ${ids.length} inactive conversations (older than 90 days)`);

    return NextResponse.json({ archived: ids.length });
  } catch (err) {
    await logError("cron/archive", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
