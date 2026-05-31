import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/services/logging";

const sampleProperties = [
  { title: "Modern Downtown Villa", price: 450000, location: "Center City", city: "Algiers", type: "villa", description: "A beautiful modern villa in the heart of the city with 4 bedrooms, pool, and garden." },
  { title: "Seaside Apartment", price: 280000, location: "Corniche", city: "Oran", type: "apartment", description: "Stunning sea-view apartment with 3 bedrooms, modern kitchen, and balcony." },
  { title: "Mountain View House", price: 320000, location: "Highland Hills", city: "Tizi Ouzou", type: "house", description: "Cozy mountain house with panoramic views, 5 bedrooms, and large backyard." },
];

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Check if user already has properties
    const { count } = await admin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id);

    if (count && count > 0) {
      return NextResponse.json({ seeded: false, message: "Already has properties" });
    }

    const toInsert = sampleProperties.map((p) => ({ ...p, owner_id: user.id }));
    const { error } = await admin.from("properties").insert(toInsert);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ seeded: true, count: sampleProperties.length });
  } catch (err) {
    await logError("seed", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
