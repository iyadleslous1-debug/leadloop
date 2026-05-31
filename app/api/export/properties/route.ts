import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportPropertiesCSV } from "@/services/export";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const csv = await exportPropertiesCSV();
    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="properties-${date}.csv"`,
      },
    });
  } catch (err) {
    console.error("[Export Properties] Error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
