import type { Lead } from "@/types/lead";
import { LeadStatusBadge } from "./LeadStatusBadge";

interface LeadTableProps {
  leads: Lead[];
}

export function LeadTable({ leads }: LeadTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-zinc-400">
            <th className="pb-3 pr-4 font-medium">Name</th>
            <th className="pb-3 pr-4 font-medium">Contact</th>
            <th className="pb-3 pr-4 font-medium">Property</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Source</th>
            <th className="pb-3 font-medium">Last Contact</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-zinc-800/50">
              <td className="py-3 pr-4 text-zinc-100">{lead.name}</td>
              <td className="py-3 pr-4 text-zinc-400">
                <div>{lead.email || "—"}</div>
                <div className="text-xs">{lead.phone || "—"}</div>
              </td>
              <td className="py-3 pr-4 text-zinc-400">
                {lead.property ? (
                  <span className="text-zinc-300">{lead.property.title}</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-3 pr-4">
                <LeadStatusBadge status={lead.status} />
              </td>
              <td className="py-3 pr-4 text-zinc-400">{lead.source}</td>
              <td className="py-3 text-zinc-400">
                {lead.last_contact_at
                  ? new Date(lead.last_contact_at).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
