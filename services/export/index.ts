import { createClient } from "@/lib/supabase/server";

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const body = rows.map((r) => columns.map((c) => escapeCSV(r[c])).join(","));
  return [header, ...body].join("\n");
}

export async function exportLeadsCSV() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("name, phone, email, status, score, source, city, notes, created_at, updated_at")
    .order("created_at", { ascending: false });

  const rows = (data || []).map((r: Record<string, unknown>) => ({
    ...r,
    score: r.score ?? "",
    notes: r.notes ?? "",
    city: r.city ?? "",
  }));

  return toCSV(rows, ["name", "phone", "email", "status", "score", "source", "city", "notes", "created_at", "updated_at"]);
}

export async function exportPropertiesCSV() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("title, type, price, city, location, description, created_at")
    .order("created_at", { ascending: false });

  const rows = (data || []).map((r: Record<string, unknown>) => ({
    ...r,
    description: r.description ?? "",
    location: r.location ?? "",
  }));

  return toCSV(rows, ["title", "type", "price", "city", "location", "description", "created_at"]);
}

export async function exportConversationsCSV() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("contact_name, phone, intent, intent_score, ai_active, status, last_message_at, created_at")
    .order("last_message_at", { ascending: false });

  const rows = (data || []).map((r: Record<string, unknown>) => ({
    ...r,
    contact_name: r.contact_name ?? "",
    intent: r.intent ?? "",
    intent_score: r.intent_score ?? "",
  }));

  return toCSV(rows, ["contact_name", "phone", "intent", "intent_score", "ai_active", "status", "last_message_at", "created_at"]);
}
