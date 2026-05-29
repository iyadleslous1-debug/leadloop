import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IntentResult } from "./intent";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function generateAIReply(
  buyerName: string,
  buyerMessage: string,
  matchedProperties: { title: string; price: number; city: string; location: string; type: string }[],
  intentSummary: string
): Promise<string> {
  if (!genAI) {
    return generateFallbackReply(buyerName, matchedProperties);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (err) {
    console.error("[Gemini] Error:", err);
    return generateFallbackReply(buyerName, matchedProperties);
  }
}

export async function detectIntentWithAI(message: string): Promise<IntentResult | null> {
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    // Normalize budget to match IntentResult type
    if (parsed.budget && typeof parsed.budget === "object") {
      parsed.budget = { detected: !!(parsed.budget.min || parsed.budget.max), ...parsed.budget };
    }
    return parsed;
  } catch (err) {
    console.error("[Gemini] Intent detection error:", err);
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
