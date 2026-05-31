export type PropertyType = "villa" | "apartment" | "house" | "land" | "commercial" | "other";
export type PropertyStatus = "for_sale" | "for_rent" | "sold" | "rented";

export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  city: string;
  type: PropertyType;
  status: PropertyStatus;
  description: string | null;
  images: string[] | null;
  video_url: string | null;
  tags: string[];
  owner_id: string;
  created_at: string;
}

export interface PropertyFormData {
  title: string;
  price: number;
  location: string;
  city: string;
  type: PropertyType;
  status?: PropertyStatus;
  description?: string;
  images?: string[];
  video_url?: string;
  tags?: string[];
}
