import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Booking } from "@/types/booking";

const VISIT_KEYWORDS = [
  "visit", "see it", "show me", "tour", "viewing", "come see",
  "زيارة", "نشوف", "نشوفها", "تشوف", "نزور",
  "visiter", "voir", "rendez-vous", "rdv",
  "tomorrow", "today", "next week", "this weekend", "الغد", "اليوم",
  "3pm", "2pm", "4pm", "5pm", "10am", "11am", "9am", "afternoon", "morning",
  "15h", "16h", "14h", "10h", "11h",
];

export function detectBookingIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return VISIT_KEYWORDS.some((kw) => lower.includes(kw));
}

function parseBookingTime(text: string): Date | null {
  const lower = text.toLowerCase();
  const now = new Date();

  const dayMatch = lower.match(/\b(tomorrow|today|next week|this weekend)\b/);
  let targetDate = new Date(now);

  if (dayMatch) {
    switch (dayMatch[1]) {
      case "tomorrow":
        targetDate.setDate(targetDate.getDate() + 1);
        break;
      case "next week":
        targetDate.setDate(targetDate.getDate() + 7);
        break;
      case "this weekend": {
        const daysUntilSaturday = (6 - targetDate.getDay() + 7) % 7;
        targetDate.setDate(targetDate.getDate() + (daysUntilSaturday || 7));
        break;
      }
      case "today":
      default:
        break;
    }
  }

  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|h)\b/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const modifier = timeMatch[3];

    if (modifier === "pm" && hours < 12) hours += 12;
    if (modifier === "am" && hours === 12) hours = 0;
    if (modifier === "h") { hours = hours; }

    targetDate.setHours(hours, minutes, 0, 0);
  } else {
    targetDate.setHours(10, 0, 0, 0);
  }

  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return targetDate;
}

export async function createBooking(leadId: string, propertyId: string | null, text: string, userId: string): Promise<Booking | null> {
  if (!detectBookingIntent(text)) return null;

  const scheduledAt = parseBookingTime(text);
  if (!scheduledAt) return null;

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("bookings")
    .insert({
      lead_id: leadId,
      property_id: propertyId,
      user_id: userId,
      scheduled_at: scheduledAt.toISOString(),
      notes: `Auto-scheduled from message: ${text}`,
    })
    .select()
    .single();

  if (error) {
    console.error("[Bookings] Create error:", error);
    return null;
  }

  return data as Booking;
}

export async function getUpcomingBookings(userId?: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const client = userId ? supabase : admin;

  let query = (client as any)
    .from("bookings")
    .select("*, lead:leads(name, phone), property:properties(title)")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(10);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data } = await query;
  return (data || []) as (Booking & { lead: { name: string; phone: string } | null; property: { title: string } | null })[];
}
