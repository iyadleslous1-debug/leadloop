import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyFormData, PropertyType } from "@/types/property";

export async function getProperties() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Property[];
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
