import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/user";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.user.id)
    .single();

  return data as Profile | null;
}

export async function updateProfile(updates: Partial<Profile>) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.user.id);

  if (error) throw error;
}
