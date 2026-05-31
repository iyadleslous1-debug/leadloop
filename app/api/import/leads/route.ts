import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    const text = await file.text();
    const Papa = (await import("papaparse")).default;
    const { data: rows, errors: parseErrors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, ""),
    });

    if (parseErrors.length > 0) {
      return NextResponse.json({ error: "CSV parse error", details: parseErrors[0] }, { status: 400 });
    }

    const sourceMap: Record<string, string> = {
      whatsapp: "whatsapp",
      website: "website",
      referral: "referral",
      manual: "manual",
      import: "import",
    };

    const leads = (rows as Record<string, string>[]).map((row) => ({
      user_id: user.id,
      name: row.name || row.full_name || row.fullname || "Unknown",
      phone: row.phone || row.mobile || row.tel || null,
      email: row.email || null,
      status: row.status || "new",
      source: sourceMap[row.source?.toLowerCase()] || "import",
      notes: row.notes || row.comment || row.comments || null,
      tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    }));

    const { data: inserted, error } = await supabase
      .from("leads")
      .insert(leads)
      .select("id, name");

    if (error) {
      return NextResponse.json({ error: "Insert failed", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ imported: inserted.length, leads: inserted });
  } catch (err) {
    console.error("[Import Leads] Error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
