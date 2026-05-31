import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, Message } from "@/types/conversation";
import { ChatView } from "./chat-view";
import { ConversationSummary } from "./summary";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (convError || !conversation) notFound();

  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (msgError) throw msgError;

  const conv = conversation as Conversation;
  const msgs = messages as Message[];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            {conv.contact_name || conv.phone}
          </h2>
          <p className="text-sm text-zinc-500">
            {conv.intent && `Intent: ${conv.intent}`}
            {conv.intent_score !== null && (
              <span className="ml-2">
                (Score: {(conv.intent_score * 100).toFixed(0)}%)
              </span>
            )}
          </p>
        </div>
        <ConversationNotes conversationId={conv.id} initialNotes={conv.notes} />
      </div>

      <ConversationSummary conversationId={conv.id} initialSummary={conv.summary} />

      <ChatView
        conversationId={conv.id}
        phone={conv.phone}
        contactName={conv.contact_name}
        aiActive={conv.ai_active}
        initialMessages={msgs}
        initialEscalated={conv.escalated}
        initialEscalationReason={conv.escalation_reason}
      />
    </div>
  );
}

function ConversationNotes({
  conversationId,
  initialNotes,
}: {
  conversationId: string;
  initialNotes: string | null;
}) {
  return (
    <div className="w-full sm:w-64">
      <ClientNotes conversationId={conversationId} initialNotes={initialNotes || ""} />
    </div>
  );
}

import { ClientNotes } from "./client-notes";
