import { Suspense } from "react";
import { Download } from "lucide-react";
import { getConversations } from "@/services/conversations";
import { ConversationList } from "./conversation-list";
import { SimulateMessageForm } from "@/components/whatsapp/SimulateMessageForm";

export const dynamic = "force-dynamic";

interface ConversationsPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function ConversationsPage({ searchParams }: ConversationsPageProps) {
  const { q, status } = await searchParams;
  const conversations = await getConversations(q, status);

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

      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-zinc-900" />}>
        <ConversationList conversations={conversations} />
      </Suspense>
    </div>
  );
}
