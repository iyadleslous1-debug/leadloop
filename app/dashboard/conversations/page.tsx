import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SimulateMessageForm } from "@/components/whatsapp/SimulateMessageForm";
import type { Conversation } from "@/types/conversation";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const supabase = await createClient();
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (error) throw error;
  const convs = conversations as Conversation[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Conversations</h2>
          <p className="text-sm text-zinc-500">
            {convs.length} conversation{convs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <SimulateMessageForm />

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {convs.length > 0 ? (
          <div className="space-y-1">
            {convs.map((conv) => (
              <Link
                key={conv.id}
                href={`/dashboard/conversations/${conv.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <MessageCircle className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {conv.contact_name || conv.phone}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {conv.intent || "No intent detected"}
                      {conv.intent_score !== null && (
                        <span className="ml-2 text-zinc-600">
                          ({(conv.intent_score * 100).toFixed(0)}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  {new Date(conv.last_message_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              No conversations yet. Use the form above to simulate a message.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
