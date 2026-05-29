import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FollowUp, FollowUpType } from "@/types/follow-up";

export async function getFollowUps() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .select("*, lead:leads(name)")
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return data as (FollowUp & { lead: { name: string } | null })[];
}

export async function getUpcomingFollowUps(days = 7) {
  const supabase = await createClient();
  const until = new Date();
  until.setDate(until.getDate() + days);

  const { data, error } = await supabase
    .from("follow_ups")
    .select("*, lead:leads(name)")
    .eq("completed", false)
    .lte("scheduled_at", until.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return data as (FollowUp & { lead: { name: string } | null })[];
}

export async function scheduleFollowUp(
  leadId: string,
  scheduledAt: Date,
  type: FollowUpType,
  message: string
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("follow_ups")
    .insert({
      lead_id: leadId,
      scheduled_at: scheduledAt.toISOString(),
      type,
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data as FollowUp;
}

export async function completeFollowUp(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("follow_ups")
    .update({ completed: true })
    .eq("id", id);

  if (error) throw error;
}

export async function scheduleDefaultFollowUps(leadId: string) {
  const now = new Date();

  const day1 = new Date(now);
  day1.setDate(day1.getDate() + 1);
  await scheduleFollowUp(leadId, day1, "suggestion", "Hi! Just checking in — would you like to see more properties matching your preferences?");

  const day3 = new Date(now);
  day3.setDate(day3.getDate() + 3);
  await scheduleFollowUp(leadId, day3, "reminder", "Reminder: We have some great new listings that might interest you. Want to take a look?");

  const day7 = new Date(now);
  day7.setDate(day7.getDate() + 7);
  await scheduleFollowUp(leadId, day7, "update", "Great news! New properties just listed. Would you like to schedule a visit?");
}
