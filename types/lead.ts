export type LeadStatus = string;

export type LeadSource = "whatsapp" | "website" | "referral" | "manual" | "import";

import type { Property } from "./property";

export interface LeadPreferences {
  budgetMin?: number;
  budgetMax?: number;
  cities?: string[];
  propertyTypes?: string[];
  bedrooms?: number;
  purchaseTimeline?: string;
  financing?: string;
  notes?: string;
}

export interface ScoreBreakdown {
  intent: number;
  recency: number;
  engagement: number;
  propertyMatch: number;
  followUp: number;
}

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
  score?: number | null;
  score_breakdown?: ScoreBreakdown | null;
  preferences?: LeadPreferences | null;
  tags: string[];
  assigned_to: string | null;
  reminder_at: string | null;
  viewed_properties: string[];
  follow_ups_paused: boolean;
  sequence_id: string | null;
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
  tags?: string[];
  assigned_to?: string;
  reminder_at?: string;
  sequence_id?: string;
}

export interface LeadStatusConfig {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
}
