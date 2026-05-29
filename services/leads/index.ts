import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadFormData, LeadStatus } from "@/types/lead";

export async function getLeads() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, property:properties(id, title)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Lead[];
}

export async function getLeadsByStatus(status: LeadStatus) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, property:properties(id, title)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Lead[];
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
  const { data, error } = await supabase.from("leads").select("status");

  if (error) throw error;

  const total = data.length;
  const hot = data.filter((l) => l.status === "hot").length;
  const warm = data.filter((l) => l.status === "warm").length;
  const cold = data.filter((l) => l.status === "cold").length;

  return { total, hot, warm, cold };
}
