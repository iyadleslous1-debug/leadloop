import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "admin" | "agent" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 0,
  agent: 10,
  admin: 20,
  owner: 30,
};

export function roleGte(role: Role, minimum: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}

export async function getUserRole(userId: string): Promise<Role | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", userId)
    .single();
  return data?.role as Role | null;
}

export async function getAgencyMemberIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, id")
    .eq("id", userId)
    .single();

  if (!profile) return [userId];

  const agencyId = profile.agency_id || profile.id;

  const { data: members } = await supabase
    .from("profiles")
    .select("id")
    .eq("agency_id", agencyId);

  const ids = members?.map((m) => m.id) || [];
  if (!ids.includes(agencyId)) ids.push(agencyId);
  return ids;
}
