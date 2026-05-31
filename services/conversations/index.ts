import { createClient } from "@/lib/supabase/server";
import type { Conversation } from "@/types/conversation";

export interface ConversationWithLastMessage extends Conversation {
  lastMessage?: string;
}

export async function getConversations(
  query?: string,
  status?: string
): Promise<ConversationWithLastMessage[]> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("conversations")
    .select("*, messages: messages(content)")
    .order("last_message_at", { ascending: false });

  if (status && status !== "all") {
    if (status === "starred") {
      dbQuery = dbQuery.eq("starred", true);
    } else {
      dbQuery = dbQuery.eq("status", status);
    }
  }

  if (query) {
    const search = `%${query}%`;
    dbQuery = dbQuery.or(`contact_name.ilike.${search},phone.ilike.${search}`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error("[Conversations] Fetch error:", error);
    return [];
  }

  return (data || []).map((conv) => {
    const messages = conv.messages as { content: string }[] | null;
    return {
      ...conv,
      lastMessage: messages?.[0]?.content || undefined,
    } as ConversationWithLastMessage;
  });
}
