import { createAdminClient } from "@/lib/supabase/admin";

type AuditAction =
  | "lead.created"
  | "lead.updated"
  | "lead.deleted"
  | "property.created"
  | "property.updated"
  | "property.deleted"
  | "conversation.updated"
  | "conversation.archived"
  | "follow_up.created"
  | "follow_up.updated"
  | "booking.created"
  | "booking.updated"
  | "suggestion.sent"
  | "suggestion.discarded"
  | "ai.toggled"
  | "user.login"
  | "user.logout"
  | "team.invite"
  | "team.remove"
  | "lead.status_changed"
  | "conversation.escalated";

export async function logAuditEvent(
  userId: string,
  action: AuditAction,
  details: Record<string, unknown> = {},
  ip?: string
) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id: userId,
      action,
      details,
      ip_address: ip || null,
    });
  } catch (err) {
    console.error("[Audit] Failed to log event:", action, err);
  }
}
