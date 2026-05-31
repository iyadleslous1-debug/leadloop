import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/services/logging";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data } = await admin
      .from("follow_up_sequences")
      .select("*, steps:follow_up_sequence_steps(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json(data || []);
  } catch (err) {
    await logError("sequences/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const admin = createAdminClient();

    const { data: seq, error: seqError } = await admin
      .from("follow_up_sequences")
      .insert({ name: body.name, user_id: user.id })
      .select()
      .single();

    if (seqError) return NextResponse.json({ error: seqError.message }, { status: 400 });

    if (body.steps && Array.isArray(body.steps)) {
      const steps = body.steps.map((step: { delay_days: number; message: string; type?: string }, i: number) => ({
        sequence_id: seq.id,
        delay_days: step.delay_days,
        message: step.message,
        type: step.type || "suggestion",
        sort_order: i,
      }));

      const { error: stepsError } = await admin.from("follow_up_sequence_steps").insert(steps);
      if (stepsError) console.error("[Sequences] Steps insert error:", stepsError);
    }

    return NextResponse.json(seq, { status: 201 });
  } catch (err) {
    await logError("sequences/post", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("follow_up_sequences").delete().eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError("sequences/delete", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
