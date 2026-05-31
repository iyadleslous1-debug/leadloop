import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadFormData, LeadStatus } from "@/types/lead";

const PAGE_SIZE = 20;

export async function getLeads(page = 1) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("leads")
    .select("*, property:properties(id, title)", { count: "exact" })
    .order("created_at", { ascending: false})
    .range(from, to);

  if (error) throw error;
  return { leads: data as Lead[], total: count || 0, page, totalPages: Math.ceil((count || 0) / PAGE_SIZE) };
}

export async function getLeadsByStatus(status: LeadStatus, page = 1) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("leads")
    .select("*, property:properties(id, title)", { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { leads: data as Lead[], total: count || 0, page, totalPages: Math.ceil((count || 0) / PAGE_SIZE) };
}

export async function getLead(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, property:properties(id, title)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function createLead(formData: LeadFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function updateLead(id: string, formData: Partial<LeadFormData>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);

  if (error) throw error;
}

export async function getLeadStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("status, score");

  if (error) throw error;

  const total = data.length;
  const hot = data.filter((l) => l.status === "hot").length;
  const warm = data.filter((l) => l.status === "warm").length;
  const cold = data.filter((l) => l.status === "cold").length;
  const scores = data.map((l) => l.score).filter((s) => typeof s === "number") as number[];
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return { total, hot, warm, cold, averageScore };
}
