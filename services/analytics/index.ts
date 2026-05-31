import { createClient } from "@/lib/supabase/server";
import type { Booking } from "@/types/booking";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface AnalyticsData {
  leads: {
    total: number;
    hot: number;
    warm: number;
    cold: number;
    averageScore: number;
    thisWeek: number;
    thisMonth: number;
    byCity: { city: string; count: number }[];
    bySource: { source: string; count: number }[];
    byPropertyType: { type: string; count: number }[];
    conversionRate: number | null;
    pipelineValue: number;
  };
  conversations: {
    total: number;
    active: number;
    today: number;
  };
  messages: {
    total: number;
    today: number;
    avgResponseMinutes: number | null;
  };
  followUps: {
    pending: number;
    completed: number;
    overdue: number;
  };
  bookings: {
    upcoming: number;
    items: (Booking & { lead: { name: string; phone: string } | null; property: { title: string } | null })[];
  };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const [leadsResult, convResult, msgResult, fuResult, bookingResult, propertyResult] = await Promise.all([
    supabase.from("leads").select("id, status, score, city, source, created_at, property_id"),
    supabase.from("conversations").select("status, last_message_at"),
    supabase.from("messages").select("id, role, conversation_id, created_at"),
    supabase.from("follow_ups").select("completed, scheduled_at"),
    supabase.from("bookings").select("*, lead:leads(name, phone), property:properties(title)").gte("scheduled_at", new Date().toISOString()).order("scheduled_at", { ascending: true }).limit(10),
    supabase.from("properties").select("id, price, type"),
  ]);

  const leads = leadsResult.data || [];
  const conversations = convResult.data || [];
  const messages = msgResult.data || [];
  const followUps = fuResult.data || [];
  const bookings = bookingResult.data || [];
  const properties = propertyResult.data || [];
  const propPriceMap = new Map(properties.map((p) => [p.id, p.price]));
  const propTypeMap = new Map(properties.map((p) => [p.id, p.type]));

  const wonKeywords = ["won", "closed", "deal", "converted", "bought", "sold"];
  const lostKeywords = ["lost"];
  let won = 0;
  let lost = 0;
  let activePipeline = 0;
  for (const l of leads) {
    const s = l.status?.toLowerCase() || "";
    if (wonKeywords.some((k) => s.includes(k))) {
      won++;
    } else if (lostKeywords.some((k) => s.includes(k))) {
      lost++;
    } else if (l.property_id && propPriceMap.has(l.property_id)) {
      activePipeline += propPriceMap.get(l.property_id)!;
    }
  }
  const conversionRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  const now = new Date().toISOString();
  const todayStart = startOfDay(new Date());
  const weekStart = daysAgo(7);
  const monthStart = daysAgo(30);

  const cityMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  const propertyTypeMap = new Map<string, number>();

  for (const l of leads) {
    if (l.city) cityMap.set(l.city, (cityMap.get(l.city) || 0) + 1);
    if (l.source) sourceMap.set(l.source, (sourceMap.get(l.source) || 0) + 1);
    if (l.property_id && propTypeMap.has(l.property_id)) {
      const pt = propTypeMap.get(l.property_id)!;
      propertyTypeMap.set(pt, (propertyTypeMap.get(pt) || 0) + 1);
    }
  }

  const leadsThisWeek = leads.filter((l) => l.created_at >= weekStart).length;
  const leadsThisMonth = leads.filter((l) => l.created_at >= monthStart).length;

  const scores = leads.map((l) => (l as any).score).filter((s) => typeof s === "number") as number[];
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const overdue = followUps.filter(
    (f) => !f.completed && f.scheduled_at < now
  ).length;

  const convFirstMsg = new Map<string, { firstUser?: string; firstAssistant?: string }>();
  for (const m of messages) {
    const cid = m.conversation_id;
    if (!cid) continue;
    if (!convFirstMsg.has(cid)) convFirstMsg.set(cid, {});
    const entry = convFirstMsg.get(cid)!;
    if (m.role === "user" && (!entry.firstUser || m.created_at < entry.firstUser)) {
      entry.firstUser = m.created_at;
    }
    if (m.role === "assistant" && (!entry.firstAssistant || m.created_at < entry.firstAssistant)) {
      entry.firstAssistant = m.created_at;
    }
  }
  const responseTimes: number[] = [];
  for (const [, entry] of convFirstMsg) {
    if (entry.firstUser && entry.firstAssistant && entry.firstAssistant > entry.firstUser) {
      const diffMs = new Date(entry.firstAssistant).getTime() - new Date(entry.firstUser).getTime();
      responseTimes.push(diffMs / 60000);
    }
  }
  const avgResponseMinutes = responseTimes.length > 0
    ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
    : null;

  return {
    leads: {
      total: leads.length,
      hot: leads.filter((l) => l.status === "hot").length,
      warm: leads.filter((l) => l.status === "warm").length,
      cold: leads.filter((l) => l.status === "cold").length,
      averageScore,
      thisWeek: leadsThisWeek,
      thisMonth: leadsThisMonth,
      byCity: Array.from(cityMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count),
      bySource: Array.from(sourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      byPropertyType: Array.from(propertyTypeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      conversionRate,
      pipelineValue: activePipeline,
    },
    conversations: {
      total: conversations.length,
      active: conversations.filter((c) => c.status === "active").length,
      today: conversations.filter((c) => c.last_message_at >= todayStart).length,
    },
    messages: {
      total: messages.length,
      today: messages.filter((m) => m.created_at >= todayStart).length,
      avgResponseMinutes,
    },
    followUps: {
      pending: followUps.filter((f) => !f.completed).length,
      completed: followUps.filter((f) => f.completed).length,
      overdue,
    },
    bookings: {
      upcoming: bookings.length,
      items: bookings as any,
    },
  };
}
