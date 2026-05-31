export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  ai_instructions: string | null;
  auto_follow_ups: boolean;
  created_at: string;
}
