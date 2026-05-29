export type LeadStatus = "hot" | "warm" | "cold";

export type LeadSource = "whatsapp" | "website" | "referral" | "manual" | "import";

import type { Property } from "./property";

export interface Lead {
  id: string;
  user_id: string;
  property_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  property?: Pick<Property, "id" | "title"> | null;
}

export interface LeadFormData {
  name: string;
  phone?: string;
  email?: string;
  status?: LeadStatus;
  source?: LeadSource;
  notes?: string;
  property_id?: string;
}
