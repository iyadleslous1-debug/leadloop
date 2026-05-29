export type PropertyType = "villa" | "apartment" | "house" | "land" | "commercial" | "other";

export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  city: string;
  type: PropertyType;
  description: string | null;
  images: string[] | null;
  owner_id: string;
  created_at: string;
}

export interface PropertyFormData {
  title: string;
  price: number;
  location: string;
  city: string;
  type: PropertyType;
  description?: string;
}
