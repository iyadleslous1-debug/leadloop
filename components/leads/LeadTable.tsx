"use client";

import { Trash2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/types/lead";
import { LeadStatusBadge } from "./LeadStatusBadge";

interface LeadTableProps {
  leads: Lead[];
}

export function LeadTable({ leads }: LeadTableProps) {
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete lead "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

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
            <th className="pb-3 pr-4 font-medium">Last Contact</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-zinc-800/50">
              <td className="py-3 pr-4">
                <a
                  href={`/dashboard/leads/${lead.id}`}
                  className="text-zinc-100 hover:text-zinc-300 underline-offset-2 hover:underline"
                >
                  {lead.name}
                </a>
              </td>
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
              <td className="py-3 pr-4 text-zinc-400">
                {lead.last_contact_at
                  ? new Date(lead.last_contact_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <a
                    href={`/dashboard/leads/${lead.id}`}
                    className="inline-flex items-center rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(lead.id, lead.name)}
                    className="inline-flex items-center rounded-md border border-red-900/50 px-2 py-1 text-xs text-red-400 hover:border-red-700 hover:text-red-300"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
