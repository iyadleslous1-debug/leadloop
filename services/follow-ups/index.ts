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
  const admin = createAdminClient();
  const now = new Date();

  // Check if lead has a custom follow-up sequence
  const { data: lead } = await admin
    .from("leads")
    .select("sequence_id")
    .eq("id", leadId)
    .single();

  if (lead?.sequence_id) {
    const { data: steps } = await admin
      .from("follow_up_sequence_steps")
      .select("*")
      .eq("sequence_id", lead.sequence_id)
      .order("sort_order", { ascending: true });

    if (steps && steps.length > 0) {
      for (const step of steps) {
        const scheduled = new Date(now);
        scheduled.setDate(scheduled.getDate() + step.delay_days);
        await scheduleFollowUp(leadId, scheduled, (step.type as FollowUpType) || "suggestion", step.message);
      }
      return;
    }
  }

  // Default drip campaign — days 1, 3, 7
  const day1 = new Date(now);
  day1.setDate(day1.getDate() + 1);
  await scheduleFollowUp(leadId, day1, "suggestion", "Thanks for reaching out! Would you like to see some property options I've found for you? Just reply and I'll send them over.");

  const day3 = new Date(now);
  day3.setDate(day3.getDate() + 3);
  await scheduleFollowUp(leadId, day3, "reminder", "Still thinking about it? No rush. Here are a few top picks in your budget range whenever you're ready.");

  const week1 = new Date(now);
  week1.setDate(week1.getDate() + 7);
  await scheduleFollowUp(leadId, week1, "suggestion", "Hi! Just checking in — would you like to see more properties matching your preferences?");

  const week2 = new Date(now);
  week2.setDate(week2.getDate() + 14);
  await scheduleFollowUp(leadId, week2, "reminder", "Reminder: We have some great new listings that might interest you. Want to take a look?");

  const week3 = new Date(now);
  week3.setDate(week3.getDate() + 21);
  await scheduleFollowUp(leadId, week3, "update", "Great news! New properties just listed in your preferred area. Would you like to schedule a visit?");

  const week4 = new Date(now);
  week4.setDate(week4.getDate() + 28);
  await scheduleFollowUp(leadId, week4, "update", "Still looking? We update our listings weekly. Here are this week's best picks for you!");

  const week6 = new Date(now);
  week6.setDate(week6.getDate() + 42);
  await scheduleFollowUp(leadId, week6, "update", "It's been a while! We have fresh listings that match your criteria. Interested?");

  const week8 = new Date(now);
  week8.setDate(week8.getDate() + 56);
  await scheduleFollowUp(leadId, week8, "update", "Monthly property digest: Here are the newest listings in your area. Let us know if anything catches your eye!");
}
