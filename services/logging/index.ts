import { createAdminClient } from "@/lib/supabase/admin";

export async function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  try {
    const admin = createAdminClient();
    await admin.from("logs").insert({
      context,
      message,
      stack: stack || null,
      metadata: metadata || {},
    });
  } catch (logErr) {
    console.error("[Logging] Failed to write log:", logErr);
  }

  console.error(`[${context}]`, message);
  if (stack) console.error(stack);
}
