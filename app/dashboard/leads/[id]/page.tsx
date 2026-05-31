import { notFound } from "next/navigation";
import { Activity, User, Bell, PauseCircle, PlayCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { getLeadTimeline } from "@/services/timeline";
import { FollowUpPauseToggle } from "@/components/leads/FollowUpPauseToggle";
import type { Lead } from "@/types/lead";

interface EditLeadPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLeadPage({ params }: EditLeadPageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("id", id).single();
  if (!lead) notFound();

  const timeline = await getLeadTimeline(id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Edit Lead</h2>
        <p className="text-sm text-zinc-500">Update lead information</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <LeadForm lead={lead as Lead} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-6 text-sm">
          {lead.assigned_to && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-400">Assigned to:</span>
              <span className="text-zinc-100">{lead.assigned_to}</span>
            </div>
          )}
          {lead.reminder_at && (
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-400">Reminder:</span>
              <span className="text-zinc-100">{new Date(lead.reminder_at).toLocaleString()}</span>
            </div>
          )}
          <FollowUpPauseToggle leadId={lead.id} paused={lead.follow_ups_paused} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Timeline</h3>
          <span className="text-xs text-zinc-500">{timeline.length} events</span>
        </div>
        <LeadTimeline events={timeline} />
      </div>
    </div>
  );
}
