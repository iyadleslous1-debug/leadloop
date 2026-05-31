import { chatCompletion } from "./groq";

const SYSTEM_PROMPT = `You are a conversation summarizer for a real estate CRM. Summarize the buyer-assistant conversation in 2-3 concise sentences in the buyer's language. Include:
- What the buyer is looking for (budget, city, property type)
- Their level of interest (hot/warm/cold)
- Any next steps agreed upon

Return ONLY the summary text, no labels or prefixes.`;

export async function summarizeConversation(messages: { role: string; content: string }[]): Promise<string | null> {
  if (messages.length === 0) return null;

  const transcript = messages
    .map((m) => `[${m.role === "user" ? "Buyer" : "Agent"}]: ${m.content}`)
    .join("\n");

  const prompt = `Summarize this real estate conversation:\n\n${transcript}`;
  return chatCompletion(prompt, SYSTEM_PROMPT);
}
