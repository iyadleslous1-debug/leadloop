import { createAdminClient } from "@/lib/supabase/admin";
import type { AIUsage } from "@/services/ai/groq";

const COST_PER_TOKEN = 0.0000001; // ~$0.10/M tokens for llama-3.1-8b

export function estimateCost(usage: AIUsage): number {
  return parseFloat((usage.total_tokens * COST_PER_TOKEN).toFixed(6));
}

export async function logAIUsage(
  usage: AIUsage,
  conversationId?: string,
  userId?: string
) {
  try {
    const admin = createAdminClient();
    await admin.from("ai_usage_logs").insert({
      conversation_id: conversationId || null,
      model: usage.model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: estimateCost(usage),
      user_id: userId || null,
    });
  } catch (err) {
    console.error("[AI Usage] Log error:", err);
  }
}
