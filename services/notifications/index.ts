import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Notification, NotificationType } from "@/types/notification";

export async function getNotifications() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as Notification[];
}

export async function getUnreadCount() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);

  if (error) throw error;
  return data.length;
}

export async function markAsRead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) throw error;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "info",
  link?: string
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .insert({ user_id: userId, title, message, type, link: link || null })
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}
