import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFailedDeliveries, retryFromQueue } from "@/lib/delivery-queue";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "iyadleslous1@gmail.com";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const items = await getFailedDeliveries();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Admin DLQ] Error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    const ok = await retryFromQueue(itemId);
    return NextResponse.json({ retried: ok });
  } catch (err) {
    console.error("[Admin DLQ] Retry error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
