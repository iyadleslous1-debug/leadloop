import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount } from "@/services/account/delete";
import { logError } from "@/services/logging";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteAccount(user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError("account/delete", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
