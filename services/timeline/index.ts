import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TimelineEvent {
  id: string;
  type: "message" | "follow_up" | "lead_created" | "status_change" | "note";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function getLeadTimeline(leadId: string): Promise<TimelineEvent[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();
  const events: TimelineEvent[] = [];

  // Get lead info
  const { data: lead } = await admin
    .from("leads")
    .select("created_at, updated_at, status, notes")
    .eq("id", leadId)
    .single();

  if (!lead) return [];

  // Lead created
  events.push({
    id: `created-${leadId}`,
    type: "lead_created",
    title: "Lead created",
    description: `Status: ${lead.status}`,
    timestamp: lead.created_at,
  });

  // Get conversation messages
  const { data: conversations } = await admin
    .from("conversations")
    .select("id")
    .eq("lead_id", leadId);

  if (conversations && conversations.length > 0) {
    const convIds = conversations.map((c) => c.id);

    const { data: messages } = await admin
      .from("messages")
      .select("id, role, content, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (messages) {
      for (const msg of messages) {
        events.push({
          id: `msg-${msg.id}`,
          type: "message",
          title: msg.role === "user" ? "Buyer message" : "Assistant reply",
          description: msg.content.slice(0, 200),
          timestamp: msg.created_at,
          metadata: { role: msg.role },
        });
      }
    }
  }

  // Get follow-ups
  const { data: followUps } = await admin
    .from("follow_ups")
    .select("id, message, completed, scheduled_at, created_at")
    .eq("lead_id", leadId)
    .order("scheduled_at", { ascending: false });

  if (followUps) {
    for (const fu of followUps) {
      events.push({
        id: `fu-${fu.id}`,
        type: "follow_up",
        title: fu.completed ? "Follow-up sent" : "Follow-up scheduled",
        description: fu.message.slice(0, 200),
        timestamp: fu.scheduled_at,
        metadata: { completed: fu.completed },
      });
    }
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}
