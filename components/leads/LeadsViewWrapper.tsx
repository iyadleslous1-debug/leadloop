"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";
import { BoardToggle } from "@/components/leads/BoardToggle";
import { KanbanBoard } from "@/components/leads/KanbanBoard";
import { LeadTable } from "@/components/leads/LeadTable";
import { PaginationBar } from "@/components/ui/PaginationBar";
import type { Lead, LeadStatus } from "@/types/lead";

function getDefaultStatuses(): string[] {
  return ["cold", "warm", "hot", "new"];
}

export function LeadsViewWrapper({
  initialLeads,
  initialTotal,
  initialPage,
  initialTotalPages,
  activeStatus,
  query,
}: {
  initialLeads: Lead[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  activeStatus?: LeadStatus;
  query: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view") || "table";
  const view = viewParam === "board" ? "board" : "table";

  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const fetchAllLeads = useCallback(async () => {
    setLoadingBoard(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setAllLeads(Array.isArray(data) ? data : []);
      }
    } catch {} finally {
      setLoadingBoard(false);
    }
  }, []);

  useEffect(() => {
    if (view === "board") fetchAllLeads();
  }, [view, fetchAllLeads]);

  function setView(v: "table" | "board") {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "board") {
      params.set("view", "board");
    } else {
      params.delete("view");
    }
    router.push(`/dashboard/leads?${params.toString()}`);
  }

  const statuses = getDefaultStatuses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">All Leads</h2>
          <p className="text-sm text-zinc-500">
            {view === "table" ? initialTotal : allLeads.length} lead{view === "table" ? (initialTotal !== 1 ? "s" : "") : (allLeads.length !== 1 ? "s" : "")} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BoardToggle view={view} onChange={setView} />
        </div>
      </div>

      {view === "board" ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          {loadingBoard ? (
            <div className="py-12 text-center text-sm text-zinc-500">Loading board...</div>
          ) : allLeads.length > 0 ? (
            <KanbanBoard leads={allLeads} statuses={statuses} onRefresh={fetchAllLeads} />
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-500">No leads yet.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            {initialLeads.length > 0 ? (
              <>
                <LeadTable leads={initialLeads} />
                <PaginationBar currentPage={initialPage} totalPages={initialTotalPages} totalItems={initialTotal} />
              </>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
                <p className="text-sm text-zinc-500">
                  {query
                    ? `No leads matching "${query}".`
                    : activeStatus
                    ? `No ${activeStatus} leads found.`
                    : "No leads yet. Add your first lead to get started."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
