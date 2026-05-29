import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property } from "@/types/property";
import type { IntentResult } from "./intent";

interface MatchResult {
  property: Property;
  score: number;
  reasons: string[];
}

export async function findBestMatches(
  intent: IntentResult,
  limit = 3,
  supabase?: SupabaseClient
): Promise<MatchResult[]> {
  const client = supabase || createAdminClient();
  let query = client.from("properties").select("*");

  if (intent.propertyType) {
    query = query.eq("type", intent.propertyType);
  }

  if (intent.budget?.max) {
    query = query.lte("price", intent.budget.max);
  }
  if (intent.budget?.min) {
    query = query.gte("price", intent.budget.min);
  }

  if (intent.location) {
    query = query.or(`city.ilike.%${intent.location}%,location.ilike.%${intent.location}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(20);
  if (error || !data) return [];

  const properties = data as Property[];
  const scored = properties.map((p) => scoreMatch(p, intent));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function scoreMatch(property: Property, intent: IntentResult): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (intent.propertyType && property.type === intent.propertyType) {
    score += 25;
    reasons.push(`matches ${intent.propertyType} type`);
  }

  if (intent.budget?.min !== undefined && intent.budget?.max !== undefined) {
    if (property.price >= intent.budget.min && property.price <= intent.budget.max) {
      score += 30;
      reasons.push("within budget range");
    } else if (property.price <= intent.budget.max! * 1.2) {
      score += 15;
      reasons.push("slightly above budget");
    }
  } else if (intent.budget?.max && property.price <= intent.budget.max) {
    score += 30;
    reasons.push("within budget");
  }

  if (intent.location) {
    const cityMatch = property.city?.toLowerCase().includes(intent.location.toLowerCase());
    const locationMatch = property.location?.toLowerCase().includes(intent.location.toLowerCase());
    if (cityMatch || locationMatch) {
      score += 25;
      reasons.push(`located in ${intent.location}`);
    }
  }

  score += Math.random() * 10;

  return { property, score, reasons };
}

export function generateRecommendationText(matches: MatchResult[], name: string): string {
  if (matches.length === 0) {
    return `Hi ${name || "there"}! Thanks for your interest. I couldn't find exact matches right now. Could you tell me more about what you're looking for? (budget, location, property type)`;
  }

  const lines = matches.map(
    (m, i) =>
      `${i + 1}. *${m.property.title}* — ${m.property.city}\n` +
      `   💰 $${m.property.price.toLocaleString()}\n` +
      `   📍 ${m.property.location}\n` +
      `   🏠 ${m.property.type}`
  );

  return (
    `Hi ${name || "there"}! Here are the best properties for you:\n\n` +
    lines.join("\n\n") +
    `\n\nWould you like more details on any of these? I can also arrange a visit! 😊`
  );
}
