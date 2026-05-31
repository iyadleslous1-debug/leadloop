import { createAdminClient } from "@/lib/supabase/admin";

interface QueueItem {
  toPhone: string;
  messageText: string;
  conversationId?: string;
  ownerId?: string;
  error?: string;
}

export async function enqueueFailedDelivery(item: QueueItem) {
  try {
    const admin = createAdminClient();
    await admin.from("delivery_queue").insert({
      to_phone: item.toPhone,
      message_text: item.messageText,
      conversation_id: item.conversationId || null,
      owner_id: item.ownerId || null,
      error: item.error || null,
      status: "failed",
    });
  } catch (err) {
    console.error("[DLQ] Failed to enqueue:", err);
  }
}

export async function getFailedDeliveries() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("delivery_queue")
      .select("*")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(50);
    return data || [];
  } catch {
    return [];
  }
}

export async function retryFromQueue(itemId: string) {
  const admin = createAdminClient();
  const { data: item } = await admin
    .from("delivery_queue")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) throw new Error("Queue item not found");

  const { sendWhatsAppMessage } = await import("@/services/whatsapp");
  try {
    await sendWhatsAppMessage(item.to_phone, item.message_text, item.owner_id || undefined, item.conversation_id || undefined);
    await admin.from("delivery_queue").update({ status: "retried" }).eq("id", itemId);
    return true;
  } catch (err) {
    const newRetryCount = (item.retry_count || 0) + 1;
    await admin
      .from("delivery_queue")
      .update({
        retry_count: newRetryCount,
        error: String(err),
        status: newRetryCount >= (item.max_retries || 3) ? "exhausted" : "failed",
      })
      .eq("id", itemId);
    return false;
  }
}
