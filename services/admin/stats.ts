import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminStats {
  users: { total: number; newThisMonth: number };
  agencies: { total: number; withTwilio: number };
  leads: { total: number; hot: number; warm: number; cold: number; averageScore: number; thisMonth: number };
  conversations: { total: number; active: number; today: number };
  messages: { total: number; today: number };
  followUps: { pending: number; completed: number; overdue: number };
  aiUsage: { totalReplies: number; uniqueConversations: number };
  errors: { total: number; last24h: number; recent: { id: string; context: string; message: string; created_at: string }[] };
  properties: { total: number };
  twilioUsage: { agency: string; phone: string; conversationCount: number }[];
  deliveryQueue: { pending: number };
}

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();

  const now = new Date().toISOString();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(monthStart.getDate() - 30);
  const dayAgo = new Date(); dayAgo.setDate(dayAgo.getDate() - 1);

  const [
    profilesRes,
    integrationsRes,
    leadsRes,
    conversationsRes,
    messagesRes,
    followUpsRes,
    logsRes,
    propertiesRes,
    dlqRes,
  ] = await Promise.all([
    admin.from("profiles").select("id, created_at"),
    admin.from("integrations").select("user_id, twilio_whatsapp_from"),
    admin.from("leads").select("status, score, created_at"),
    admin.from("conversations").select("status, last_message_at, owner_id"),
    admin.from("messages").select("id, role, created_at, conversation_id"),
    admin.from("follow_ups").select("completed, scheduled_at"),
    admin.from("logs").select("id, context, message, created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("properties").select("id"),
    admin.from("delivery_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  const profiles = profilesRes.data || [];
  const integrations = integrationsRes.data || [];
  const leads = leadsRes.data || [];
  const conversations = conversationsRes.data || [];
  const messages = messagesRes.data || [];
  const followUps = followUpsRes.data || [];
  const logs = logsRes.data || [];
  const properties = propertiesRes.data || [];

  const scores = leads.map((l: any) => l.score).filter((s: any) => typeof s === "number") as number[];
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const aiMessages = messages.filter((m: any) => m.role === "assistant");
  const uniqueConvIds = new Set(aiMessages.map((m: any) => m.conversation_id));

  const integratedUserIds = new Set(integrations.map((i: any) => i.user_id));

  const twilioUsage = integrations.map((i: any) => {
    const convCount = conversations.filter((c: any) => c.owner_id === i.user_id).length;
    return { agency: i.user_id, phone: i.twilio_whatsapp_from, conversationCount: convCount };
  });

  const recentErrors = logs
    .filter((l: any) => l.message)
    .slice(0, 10)
    .map((l: any) => ({ id: l.id, context: l.context, message: l.message, created_at: l.created_at }));

  return {
    users: {
      total: profiles.length,
      newThisMonth: profiles.filter((p: any) => p.created_at >= monthStart.toISOString()).length,
    },
    agencies: {
      total: integratedUserIds.size,
      withTwilio: integratedUserIds.size,
    },
    leads: {
      total: leads.length,
      hot: leads.filter((l: any) => l.status === "hot").length,
      warm: leads.filter((l: any) => l.status === "warm").length,
      cold: leads.filter((l: any) => l.status === "cold").length,
      averageScore: avgScore,
      thisMonth: leads.filter((l: any) => l.created_at >= monthStart.toISOString()).length,
    },
    conversations: {
      total: conversations.length,
      active: conversations.filter((c: any) => c.status === "active").length,
      today: conversations.filter((c: any) => c.last_message_at >= todayStart.toISOString()).length,
    },
    messages: {
      total: messages.length,
      today: messages.filter((m: any) => m.created_at >= todayStart.toISOString()).length,
    },
    followUps: {
      pending: followUps.filter((f: any) => !f.completed).length,
      completed: followUps.filter((f: any) => f.completed).length,
      overdue: followUps.filter((f: any) => !f.completed && f.scheduled_at < now).length,
    },
    aiUsage: {
      totalReplies: aiMessages.length,
      uniqueConversations: uniqueConvIds.size,
    },
    errors: {
      total: logs.length,
      last24h: logs.filter((l: any) => l.created_at >= dayAgo.toISOString()).length,
      recent: recentErrors,
    },
    properties: { total: properties.length },
    twilioUsage,
    deliveryQueue: { pending: dlqRes.count || 0 },
  };
}
