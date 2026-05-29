export type NotificationType = "info" | "lead_hot" | "lead_warm" | "message" | "follow_up";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  read: boolean;
  created_at: string;
}
