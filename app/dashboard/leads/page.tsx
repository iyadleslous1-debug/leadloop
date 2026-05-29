import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getLeads, getLeadsByStatus } from "@/services/leads";
import { getProperties } from "@/services/properties";
import { LeadTable } from "@/components/leads/LeadTable";
import { Button } from "@/components/ui/button";
import { LeadStatusFilter } from "./lead-status-filter";
import type { LeadStatus } from "@/types/lead";

interface LeadsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { status } = await searchParams;
  const activeStatus = (status as LeadStatus) || undefined;

  const [leads, properties] = await Promise.all([
    activeStatus ? getLeadsByStatus(activeStatus) : getLeads(),
    getProperties(),
  ]);

  const propertyMap = new Map(properties.map((p) => [p.id, p.title]));
  const counts = { hot: 0, warm: 0, cold: 0 };
  for (const l of leads) {
    if (l.status in counts) counts[l.status as keyof typeof counts]++;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">All Leads</h2>
          <p className="text-sm text-zinc-500">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/leads/new">
            <Plus className="h-4 w-4" />
            Add Lead
          </a>
        </Button>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <LeadStatusFilter current={activeStatus} />
      </Suspense>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {leads.length > 0 ? (
          <LeadTable leads={leads} />
        ) : (
          <p className="py-12 text-center text-sm text-zinc-500">
            {activeStatus
              ? `No ${activeStatus} leads found.`
              : 'No leads yet. Click "Add Lead" to create one.'}
          </p>
        )}
      </div>

      {properties.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">
            Quick Add Lead to Property
          </h3>
          <div className="flex flex-wrap gap-2">
            {properties.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
              >
                {p.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
