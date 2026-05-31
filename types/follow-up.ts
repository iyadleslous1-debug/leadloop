export type FollowUpType = "suggestion" | "reminder" | "update" | "custom";

export interface FollowUp {
  id: string;
  lead_id: string;
  scheduled_at: string;
  type: FollowUpType;
  message: string;
  completed: boolean;
  created_at: string;
  lead?: { name: string; phone: string } | null;
}

export interface FollowUpSequence {
  id: string;
  user_id: string;
  name: string;
  steps?: FollowUpSequenceStep[];
  created_at: string;
}

export interface FollowUpSequenceStep {
  id: string;
  sequence_id: string;
  delay_days: number;
  message: string;
  type: FollowUpType;
  sort_order: number;
}
