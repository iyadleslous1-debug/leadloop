import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAccount(userId: string) {
  const admin = createAdminClient();

  // 1. Delete notifications
  await admin.from("notifications").delete().eq("user_id", userId);

  // 2. Delete follow-ups via leads
  const { data: leads } = await admin.from("leads").select("id").eq("user_id", userId);
  const leadIds = (leads || []).map((l: { id: string }) => l.id);

  if (leadIds.length > 0) {
    await admin.from("follow_ups").delete().in("lead_id", leadIds);
  }

  // 3. Delete messages via conversations
  const { data: conversations } = await admin.from("conversations").select("id").eq("owner_id", userId);
  const convIds = (conversations || []).map((c: { id: string }) => c.id);

  if (convIds.length > 0) {
    await admin.from("messages").delete().in("conversation_id", convIds);
    await admin.from("delivery_logs").delete().in("conversation_id", convIds);
    await admin.from("delivery_queue").delete().eq("owner_id", userId);
  }

  // 4. Delete conversations
  await admin.from("conversations").delete().eq("owner_id", userId);

  // 5. Delete leads
  await admin.from("leads").delete().eq("user_id", userId);

  // 6. Delete properties
  await admin.from("properties").delete().eq("owner_id", userId);

  // 7. Delete Twilio integration
  await admin.from("integrations").delete().eq("user_id", userId);

  // 8. Delete profile
  await admin.from("profiles").delete().eq("id", userId);

  // 9. Delete auth user
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Failed to delete auth user: ${error.message}`);
}
