export interface Booking {
  id: string;
  lead_id: string;
  property_id: string | null;
  user_id: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: { name: string; phone: string } | null;
  property?: { title: string } | null;
}
