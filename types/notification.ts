export type NotificationType = "info" | "lead_hot" | "lead_warm" | "message" | "follow_up";
export type NotificationPriority = "urgent" | "normal" | "low";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link: string | null;
  read: boolean;
  created_at: string;
}
