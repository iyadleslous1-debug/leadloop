import { Suspense } from "react";
import { Download, MessageCircle } from "lucide-react";
import { getConversations } from "@/services/conversations";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "./conversation-list";
import { SimulateMessageForm } from "@/components/whatsapp/SimulateMessageForm";
import { SplitPane } from "@/components/layout/SplitPane";
import { ChatView } from "./[id]/chat-view";
import { ConversationSummary } from "./[id]/summary";
import { ClientNotes } from "./[id]/client-notes";
import type { Conversation, Message } from "@/types/conversation";

export const dynamic = "force-dynamic";

interface ConversationsPageProps {
  searchParams: Promise<{ q?: string; status?: string; selected?: string }>;
}

export default async function ConversationsPage({ searchParams }: ConversationsPageProps) {
  const { q, status, selected } = await searchParams;
  const conversations = await getConversations(q, status);

  let selectedConv: Conversation | null = null;
  let selectedMessages: Message[] = [];

  if (selected) {
    const supabase = await createClient();
    const { data: conv } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", selected)
      .single();
    if (conv) {
      selectedConv = conv as Conversation;
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selected)
        .order("created_at", { ascending: true });
      selectedMessages = (msgs || []) as Message[];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Conversations</h2>
          <p className="text-sm text-zinc-500">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a
          href="/api/export/conversations"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <SimulateMessageForm />

      {selectedConv ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden" style={{ height: "calc(100vh - 14rem)" }}>
          <SplitPane
            left={
              <Suspense fallback={<div className="h-40 animate-pulse bg-zinc-900" />}>
                <ConversationList conversations={conversations} />
              </Suspense>
            }
            right={
              <div className="flex h-full flex-col p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">
                      {selectedConv.contact_name || selectedConv.phone}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {selectedConv.intent && `Intent: ${selectedConv.intent}`}
                      {selectedConv.intent_score !== null && (
                        <span className="ml-2">
                          (Score: {(selectedConv.intent_score * 100).toFixed(0)}%)
                        </span>
                      )}
                    </p>
                  </div>
                  <ClientNotes conversationId={selectedConv.id} initialNotes={selectedConv.notes || ""} />
                </div>
                <ConversationSummary conversationId={selectedConv.id} initialSummary={selectedConv.summary} />
                <div className="flex-1 min-h-0">
                  <ChatView
                    conversationId={selectedConv.id}
                    phone={selectedConv.phone}
                    contactName={selectedConv.contact_name}
                    aiActive={selectedConv.ai_active}
                    initialMessages={selectedMessages}
                    initialEscalated={selectedConv.escalated}
                    initialEscalationReason={selectedConv.escalation_reason}
                  />
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-zinc-900" />}>
          <ConversationList conversations={conversations} />
        </Suspense>
      )}
    </div>
  );
}
