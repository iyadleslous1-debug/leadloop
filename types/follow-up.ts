export type FollowUpType = "suggestion" | "reminder" | "update" | "custom";

export interface FollowUp {
  id: string;
  lead_id: string;
  scheduled_at: string;
  type: FollowUpType;
  message: string;
  completed: boolean;
  created_at: string;
}
