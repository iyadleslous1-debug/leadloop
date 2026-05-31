import { Suspense } from "react";
import { Plus, Users, Download } from "lucide-react";
import Link from "next/link";
import { getLeads, getLeadsByStatus } from "@/services/leads";
import { getProperties } from "@/services/properties";
import { LeadTable } from "@/components/leads/LeadTable";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Button } from "@/components/ui/button";
import { LeadStatusFilter } from "./lead-status-filter";
import type { LeadStatus } from "@/types/lead";

interface LeadsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const activeStatus = (params.status as LeadStatus) || undefined;
  const page = parseInt(params.page || "1", 10) || 1;

  const [result, propResult] = await Promise.all([
    (activeStatus ? getLeadsByStatus(activeStatus, page) : getLeads(page)).catch(() => ({ leads: [], total: 0, page: 1, totalPages: 0 })),
    getProperties().catch(() => ({ properties: [], total: 0, page: 1, totalPages: 0 })),
  ]);

  const { leads, total, totalPages } = result;
  const properties = propResult.properties;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">All Leads</h2>
          <p className="text-sm text-zinc-500">
            {total} lead{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <Link href="/dashboard/leads/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <LeadStatusFilter current={activeStatus} />
      </Suspense>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {leads.length > 0 ? (
          <>
            <LeadTable leads={leads} />
            <PaginationBar currentPage={page} totalPages={totalPages} totalItems={total} />
          </>
        ) : (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              {activeStatus
                ? `No ${activeStatus} leads found.`
                : 'No leads yet. Add your first lead to get started.'}
            </p>
          </div>
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
