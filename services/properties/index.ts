import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyFormData, PropertyType, PropertyStatus } from "@/types/property";

const PAGE_SIZE = 20;

export async function getProperties(page = 1, filters?: { q?: string; type?: string; status?: string }) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from("properties").select("*", { count: "exact" });

  if (filters?.q) {
    query = query.or(`title.ilike.%${filters.q}%,city.ilike.%${filters.q}%,location.ilike.%${filters.q}%`);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { properties: data as Property[], total: count || 0, page, totalPages: Math.ceil((count || 0) / PAGE_SIZE) };
}

export async function getPropertiesByType(type: PropertyType) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("type", type)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Property[];
}

export async function getProperty(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Property;
}

export async function createProperty(formData: PropertyFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...formData, owner_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Property;
}

export async function updateProperty(id: string, formData: Partial<PropertyFormData>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Property;
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (error) throw error;
}

export async function getPropertyStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("properties").select("type");

  if (error) throw error;

  const total = data.length;
  const types: Record<string, number> = {};
  for (const p of data) {
    types[p.type] = (types[p.type] || 0) + 1;
  }

  return { total, types };
}
