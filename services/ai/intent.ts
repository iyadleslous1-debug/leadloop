export type BuyerLanguage = "ar" | "fr" | "en" | "darija" | "unknown";

export interface IntentResult {
  budget: { detected: boolean; min?: number; max?: number } | null;
  location: string | null;
  urgency: number;
  interest: number;
  propertyType: string | null;
  bedrooms?: number | null;
  purchaseTimeline?: string | null;
  financing?: string | null;
  score: number;
  summary: string;
  language?: BuyerLanguage;
}

const ARABIC_PATTERN = /[\u0600-\u06FF]/;

const FRENCH_ACCENTS_PATTERN = /[éèêëàâùûüôöîïç]/i;

const DARIJA_MARKERS = [
  "واش", "شنو", "اشمن", "فين", "علاش", "ملي", "كيفاش",
  "بزاف", "شويا", "دaba", "دابا", "هاد", "هاذ", "ذاك", "تلك",
  "ana", "nta", "nti", "hna", "huma", " had ", " rak ", " raki ",
  "wah", "lah", " walou", "bsara", "bsaraha",
];

export function detectLanguage(text: string): BuyerLanguage {
  if (ARABIC_PATTERN.test(text)) {
    const words = text.toLowerCase().split(/\s+/);
    const darijaCount = DARIJA_MARKERS.filter((m) => words.some((w) => w.includes(m))).length;
    if (darijaCount >= 2) return "darija";
    return "ar";
  }
  if (FRENCH_ACCENTS_PATTERN.test(text)) return "fr";
  return "en";
}

const URGENCY_KEYWORDS = [
  "urgent", "soon", "asap", "quick", "today", "immediately", "now", "fast", "hurry",
  "need it", "right away", "as soon as",
  "عاجل", "بسرعة", "الآن", "ضروري", "اليوم",
  "urgent", "vite", "rapidement", "aujourd'hui", "immédiatement",
  "دaba", "دابا", "بزاف",
];

const INTEREST_KEYWORDS = [
  "interested", "want to buy", "looking for", "need a", "need an",
  "visit", "see", "show", "available", "vacant", "move in",
  "مهتم", "أبحث عن", "أريد", "نريد", "عندي", "شوف",
  "intéressé", "cherche", "veux acheter", "visiter", "disponible",
  "bghit", "bghina", "nadi", "chof", "tchouf", "kayn",
];

const HIGH_INTENT_PHRASES = [
  "i want to buy", "i am interested", "when can i visit",
  "i need a property", "show me", "available now",
  "send me details", "i'm ready", "let's do it",
  "عايز أشتري", "أريد شراء", "أنا مهتم", "أرسل التفاصيل",
  "je veux acheter", "je suis intéressé", "envoyez les détails",
  "bghit nchri", "bghina", "warna", "sift details",
];

const PROPERTY_TYPE_KEYWORDS: Record<string, string[]> = {
  villa: ["villa", "villas", "mansion", "فيلا", "قصر"],
  apartment: ["apartment", "flat", "condo", "condominium", "studio", "شقة", "appartement", "appart"],
  house: ["house", "home", "bungalow", "townhouse", "منزل", "دار", "maison"],
  land: ["land", "plot", "vacant land", "empty lot", "أرض", "قطعة أرض", "terrain"],
  commercial: ["commercial", "office", "retail", "shop", "warehouse", "تجاري", "محل", "مكتب", "local", "bureau"],
};

const CITIES = [
  "dubai", "abu dhabi", "sharjah", "ajman", "rak", "fujairah",
  "new york", "los angeles", "miami", "london", "paris",
  "riyadh", "jeddah", "doha", "kuwait", "manama", "muscat",
  "algiers", "الجزائر", "alger",
  "oran", "وهران",
  "constantine", "قسنطينة",
  "annaba", "عنابة",
  "tizi ouzou", "تيزي وزو",
  "setif", "سطيف",
  "blida", "البليدة",
  "tlemcen", "تلمسان",
  "bejaia", "بجاية",
  "biskra", "بسكرة",
  "tebessa", "تبسة",
  "djelfa", "الجلفة",
  "skikda", "سكيكدة",
  "batna", "باتنة",
  "bab el oued", "hydra", "ben aknoun", "cheraga", "dely brahim",
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

  const bedroomMatch = text.match(/(\d+)\s*(bedroom|bed|chambre|غرفة|غرف)\b/);
  const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1], 10) : null;

  const timelineKeywords: Record<string, string[]> = {
    "asap": ["asap", "urgent", "immediately", "right away", "الآن", "عاجل"],
    "1-3 months": ["this month", "next month", "in a month"],
    "3-6 months": ["in 3 months", "a few months"],
    "6+ months": ["not urgent", "just looking", "eventually"],
  };
  let purchaseTimeline: string | null = null;
  for (const [tl, kws] of Object.entries(timelineKeywords)) {
    if (kws.some((kw) => text.includes(kw))) { purchaseTimeline = tl; break; }
  }

  const financingKeywords: Record<string, string[]> = {
    "cash": ["cash", "نقداً", "comptant"],
    "mortgage": ["mortgage", "loan", "financing", "financement", "crédit", "قرض"],
    "installments": ["installment", "تقسيط", "tranches"],
  };
  let financing: string | null = null;
  for (const [fn, kws] of Object.entries(financingKeywords)) {
    if (kws.some((kw) => text.includes(kw))) { financing = fn; break; }
  }

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
    bedrooms,
    purchaseTimeline,
    financing,
    score,
    summary: signals.length > 0 ? signals.join(", ") : "general inquiry",
    language: detectLanguage(message),
  };
}

export function classifyLeadScore(intent: IntentResult): "hot" | "warm" | "cold" {
  if (intent.score >= 0.6) return "hot";
  if (intent.score >= 0.3) return "warm";
  return "cold";
}
