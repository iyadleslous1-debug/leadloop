import type { Lead } from "@/types/lead";
import { LeadStatusBadge } from "./LeadStatusBadge";

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-zinc-100">{lead.name}</h3>
        <LeadStatusBadge status={lead.status} score={lead.score} />
      </div>
      <div className="mt-2 space-y-1 text-sm text-zinc-400">
        {lead.email && <p>{lead.email}</p>}
        {lead.phone && <p>{lead.phone}</p>}
        <p>Source: {lead.source}</p>
      </div>
      <div className="mt-3 text-xs text-zinc-500">
        {lead.last_contact_at
          ? `Last contact: ${new Date(lead.last_contact_at).toLocaleDateString()}`
          : "No contact yet"}
      </div>
    </div>
  );
}
