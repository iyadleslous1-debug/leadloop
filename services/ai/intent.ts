export interface IntentResult {
  budget: { detected: boolean; min?: number; max?: number } | null;
  location: string | null;
  urgency: number;
  interest: number;
  propertyType: string | null;
  score: number;
  summary: string;
}

const URGENCY_KEYWORDS = [
  "urgent", "soon", "asap", "quick", "today", "immediately", "now", "fast", "hurry",
  "need it", "right away", "as soon as",
];

const INTEREST_KEYWORDS = [
  "interested", "want to buy", "looking for", "need a", "need an",
  "visit", "see", "show", "available", "vacant", "move in",
];

const HIGH_INTENT_PHRASES = [
  "i want to buy", "i am interested", "when can i visit",
  "i need a property", "show me", "available now",
  "send me details", "i'm ready", "let's do it",
];

const PROPERTY_TYPE_KEYWORDS: Record<string, string[]> = {
  villa: ["villa", "villas", "mansion"],
  apartment: ["apartment", "flat", "condo", "condominium", "studio"],
  house: ["house", "home", "bungalow", "townhouse"],
  land: ["land", "plot", "vacant land", "empty lot"],
  commercial: ["commercial", "office", "retail", "shop", "warehouse"],
};

const CITIES = [
  "dubai", "abu dhabi", "sharjah", "ajman", "rak", "fujairah",
  "new york", "los angeles", "miami", "london", "paris",
  "riyadh", "jeddah", "doha", "kuwait", "manama", "muscat",
];

function extractBudgets(text: string): { min?: number; max?: number } | null {
  const between = text.match(/between\s+\$?(\d+[kKmMbB]?)\s+and\s+\$?(\d+[kKmMbB]?)/i);
  if (between) {
    return { min: parseAmount(between[1]), max: parseAmount(between[2]) };
  }

  const under = text.match(/under\s+\$?(\d+[kKmMbB]?)/i);
  if (under) return { max: parseAmount(under[1]) };

  const numbers = [...text.matchAll(/\$?(\d+[kKmMbB]?)/g)];
  const amounts = numbers.map((m) => parseAmount(m[1])).filter((a) => a >= 10000 && a <= 100_000_000);
  if (amounts.length === 1) return { min: amounts[0] * 0.8, max: amounts[0] * 1.2 };
  if (amounts.length >= 2) return { min: Math.min(...amounts), max: Math.max(...amounts) };

  return null;
}

function parseAmount(s: string): number {
  const lower = s.toLowerCase();
  const num = parseFloat(lower.replace(/[kmb]/g, ""));
  if (lower.includes("b")) return num * 1_000_000_000;
  if (lower.includes("m")) return num * 1_000_000;
  if (lower.includes("k")) return num * 1_000;
  return num;
}

function extractLocation(text: string): string | null {
  for (const city of CITIES) {
    if (text.toLowerCase().includes(city)) return city;
  }
  const near = text.match(/\bin\s+(\w+)/i)?.[1];
  const area = text.match(/\bnear\s+(\w+(?:\s+\w+)?)/i)?.[1];
  return near || area || null;
}

function extractPropertyType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(PROPERTY_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return type;
    }
  }
  return null;
}

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

export function detectIntent(message: string): IntentResult {
  const text = message.toLowerCase().trim();

  const budget = extractBudgets(text);
  const location = extractLocation(text);
  const propertyType = extractPropertyType(text);
  const urgencyCount = countMatches(text, URGENCY_KEYWORDS);
  const interestCount = countMatches(text, INTEREST_KEYWORDS);
  const hasHighIntent = HIGH_INTENT_PHRASES.some((p) => text.includes(p));

  const urgency = Math.min(urgencyCount / 3, 1);
  const interest = Math.min((interestCount + (hasHighIntent ? 2 : 0)) / 5, 1);
  const hasBudget = budget ? 0.3 : 0;
  const hasLocation = location ? 0.2 : 0;
  const hasType = propertyType ? 0.2 : 0;
  const score = Math.min(urgency * 0.3 + interest * 0.4 + hasBudget + hasLocation + hasType, 1);

  const signals: string[] = [];
  if (budget) signals.push("budget specified");
  if (location) signals.push(`location: ${location}`);
  if (propertyType) signals.push(`type: ${propertyType}`);
  if (urgency > 0.5) signals.push("urgent");
  if (interest > 0.5) signals.push("high interest");
  if (hasHighIntent) signals.push("ready to buy");

  return {
    budget: budget ? { detected: true, ...budget } : null,
    location,
    urgency,
    interest,
    propertyType,
    score,
    summary: signals.length > 0 ? signals.join(", ") : "general inquiry",
  };
}

export function classifyLeadScore(intent: IntentResult): "hot" | "warm" | "cold" {
  if (intent.score >= 0.6) return "hot";
  if (intent.score >= 0.3) return "warm";
  return "cold";
}
