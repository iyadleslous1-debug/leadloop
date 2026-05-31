export type MessageRole = "user" | "assistant" | "system";
export type ConversationStatus = "active" | "archived";

export interface Conversation {
  id: string;
  phone: string;
  contact_name: string | null;
  owner_id: string | null;
  lead_id: string | null;
  property_id: string | null;
  intent: string | null;
  intent_score: number | null;
  ai_active: boolean;
  status: ConversationStatus;
  starred: boolean;
  notes: string | null;
  pending_suggestion: string | null;
  pending_suggestion_media: string[] | null;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
