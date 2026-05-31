import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeConversation } from "@/services/ai/summarize";
import type { Message } from "@/types/conversation";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: messages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const summary = await summarizeConversation(messages as Pick<Message, "role" | "content">[]);
    if (!summary) {
      return NextResponse.json({ error: "Summarization failed" }, { status: 500 });
    }

    await supabase
      .from("conversations")
      .update({ summary })
      .eq("id", id);

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[Summarize] Error:", err);
    return NextResponse.json({ error: "Summarization failed" }, { status: 500 });
  }
}
