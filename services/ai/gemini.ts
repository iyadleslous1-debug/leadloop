import type { IntentResult } from "./intent";

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

export async function generateAIReply(
  buyerName: string,
  buyerMessage: string,
  matchedProperties: { title: string; price: number; city: string; location: string; type: string }[],
  intentSummary: string
): Promise<string> {
  const propertyList = matchedProperties.length > 0
    ? matchedProperties.map((p, i) =>
        `${i + 1}. ${p.title} — ${p.city}, ${p.location}\n   Price: $${p.price.toLocaleString()}\n   Type: ${p.type}`
      ).join("\n\n")
    : "No matching properties found in the database.";

  const prompt = `You are a friendly, professional real estate assistant working for a property agency. A potential buyer messaged on WhatsApp.

Buyer name: ${buyerName}
Buyer message: "${buyerMessage}"
Detected intent: ${intentSummary}

Available matching properties:
${propertyList}

Rules:
- Reply in the SAME language the buyer used (Arabic if they wrote Arabic, English if English, French if French)
- Be warm, professional, and concise (WhatsApp messages should be short)
- If properties match, list the top 3 with price and location
- If no properties match, ask clarifying questions about budget, location, and property type
- Always end with a call to action (schedule a visit, send more details, etc.)
- Use emojis sparingly for a friendly tone
- Do NOT use markdown formatting — plain text only for WhatsApp
- Keep the reply under 300 words`;

  const reply = await chatCompletion(prompt);
  if (reply) return reply;
  return generateFallbackReply(buyerName, matchedProperties);
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
