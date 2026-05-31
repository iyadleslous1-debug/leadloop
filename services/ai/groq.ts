import type { IntentResult, BuyerLanguage } from "./intent";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

function getApiKey() {
  return process.env.GROQ_API_KEY;
}

async function chatCompletion(prompt: string, systemPrompt?: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Groq] API error:", res.status, err);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[Groq] Request error:", err);
    return null;
  }
}

function formatPropertyList(
  properties: { title: string; price: number; city: string; location: string; type: string }[]
): string {
  if (properties.length === 0) return "";
  return properties
    .map((p, i) => `${i + 1}. ${p.title} — ${p.city}, ${p.location}\n   Price: $${p.price.toLocaleString()} | ${p.type}`)
    .join("\n\n");
}

const LANGUAGE_LABELS: Record<BuyerLanguage, string> = {
  ar: "Arabic",
  fr: "French",
  en: "English",
  darija: "Algerian Darija",
  unknown: "English",
};

export async function generateAIReply(
  buyerName: string,
  buyerMessage: string,
  matchedProperties: { title: string; price: number; city: string; location: string; type: string }[],
  intentSummary: string,
  language?: BuyerLanguage,
  conversationHistory?: { role: string; content: string }[],
  systemPrompt?: string,
  buyerPreferences?: string
): Promise<string> {
  const propertyBlock = formatPropertyList(matchedProperties);
  const lang = language || "en";
  const langName = LANGUAGE_LABELS[lang];

  const historyBlock = conversationHistory && conversationHistory.length > 0
    ? `\nConversation history (newest first):\n${conversationHistory.slice(-6).map((m) => `  [${m.role}]: ${m.content}`).join("\n")}`
    : "";

  const prefsBlock = buyerPreferences ? `\nBuyer preferences: ${buyerPreferences}` : "";

  if (propertyBlock) {
    const prompt = `You are a WhatsApp real estate assistant for an Algerian agency. Your ONLY job is to write a SHORT greeting and call-to-action in the buyer's language.

Buyer name: ${buyerName}
Their message: "${buyerMessage}"
What they want: ${intentSummary}
Detected language: ${langName}${historyBlock}${prefsBlock}

CRITICAL RULES:
- Reply in ${langName} — NOT English. Match the buyer's language exactly (Arabic, French, or Darija)
- Write ONLY 1-2 sentences: a warm greeting + a prompt to check out the properties below
- Do NOT list any properties yourself — they will be shown after your message
- Do not mention specific prices, cities, or property types
- End with a short call to action (reply for details, schedule a visit, etc.)
- Plain text only, no markdown
- Keep it under 60 words`;

    const intro = await chatCompletion(prompt, systemPrompt);
    if (intro) return `${intro}\n\n${propertyBlock}`;
    const fallbacks: Record<string, string> = {
      ar: `مرحباً ${buyerName || "هناك"}! إليك أفضل العقارات المناسبة لك:\n\n${propertyBlock}\n\nهل ترغب في معرفة المزيد أو حجز موعد للزيارة؟`,
      fr: `Bonjour ${buyerName || "là"}! Voici les meilleures propriétés pour vous:\n\n${propertyBlock}\n\nSouhaitez-vous plus de détails ou planifier une visite ?`,
      darija: `Salam ${buyerName || "hna"}! Hadi ahsan property li Kaynin:\n\n${propertyBlock}\n\nBghiti tchouf akter wala tjib mowad ?`,
    };
    return fallbacks[lang] || `Hi ${buyerName || "there"}! Here are the best properties for you:\n\n${propertyBlock}\n\nWould you like more details on any of these?`;
  }

  const prompt = `You are a WhatsApp real estate assistant for an Algerian agency. The buyer's message doesn't match any available properties.

Buyer: ${buyerName}
Their message: "${buyerMessage}"
What they want: ${intentSummary}
Detected language: ${langName}${historyBlock}${prefsBlock}

Rules:
- Reply in ${langName} — NOT English
- Be warm and helpful
- If buyer has existing preferences, reference them and ask if they changed
- Ask what specific city, budget range, or property type they're looking for
- End with encouragement to share more details
- Keep it under 100 words
- Plain text only, no markdown`;

  const reply = await chatCompletion(prompt, systemPrompt);
  if (reply) return reply;
  const fallbacks: Record<string, string> = {
    ar: `مرحباً ${buyerName || "هناك"}! شكراً لاهتمامك. هل يمكنك إخباري بالمزيد عن ما تبحث عنه؟ (الميزانية، المدينة، نوع العقار)`,
    fr: `Bonjour ${buyerName || "là"}! Merci de votre intérêt. Pouvez-vous me dire ce que vous recherchez exactement ? (budget, ville, type de bien)`,
    darija: `Salam ${buyerName || "hna"}! Shukran ala interesse. Wash t9dar tgoli aktar ala hadchi li t9essad ? (budget, mdina, no3 d property)`,
  };
  return fallbacks[lang] || `Hi ${buyerName || "there"}! Thanks for your interest. Could you tell me more about what you're looking for? (budget, location, property type)`;
}

export async function detectIntentWithAI(message: string): Promise<IntentResult | null> {
  if (!getApiKey()) return null;

  const prompt = `Analyze this real estate buyer message and extract structured intent data.

Message: "${message}"

Return ONLY a JSON object (no markdown, no code fences) with these fields:
{
  "budget": { "min": number or null, "max": number or null },
  "location": "city name" or null,
  "propertyType": "villa" | "apartment" | "house" | "land" | "commercial" | "other" or null,
  "bedrooms": number or null (how many bedrooms they want),
  "purchaseTimeline": "asap" | "1-3 months" | "3-6 months" | "6+ months" | null (how soon they need to buy),
  "financing": "cash" | "mortgage" | "installments" | null (how they plan to pay),
  "urgency": number 0-1 (how urgent they sound),
  "interest": number 0-1 (how interested they are in buying),
  "score": number 0-1 (overall lead quality score),
  "summary": "brief description of what the buyer wants"
}

If the message is not about real estate, set score to 0 and summary to "general inquiry".`;

  const text = await chatCompletion(prompt, "You are an intent extraction engine. Return only valid JSON.");
  if (!text) return null;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.budget && typeof parsed.budget === "object") {
      parsed.budget = { detected: !!(parsed.budget.min || parsed.budget.max), ...parsed.budget };
    }
    return parsed;
  } catch (err) {
    console.error("[Groq] Intent parse error:", err);
    return null;
  }
}

function generateFallbackReply(
  name: string,
  properties: { title: string; price: number; city: string; location: string; type: string }[]
): string {
  if (properties.length === 0) {
    return `Hi ${name || "there"}! Thanks for your interest. Could you tell me more about what you're looking for? (budget, location, property type)`;
  }

  const lines = properties.map(
    (p, i) => `${i + 1}. ${p.title} — ${p.city}\n   $${p.price.toLocaleString()} | ${p.location}`
  );

  return `Hi ${name || "there"}! Here are the best properties for you:\n\n${lines.join("\n\n")}\n\nWould you like more details or want to schedule a visit? 😊`;
}
