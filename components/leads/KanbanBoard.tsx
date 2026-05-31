"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import type { Lead } from "@/types/lead";

interface KanbanBoardProps {
  leads: Lead[];
  statuses: string[];
  onRefresh: () => void;
}

function SortableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-zinc-800/50 p-3 text-sm transition-shadow ${
        isDragging ? "z-50 border-emerald-500/50 shadow-lg shadow-emerald-500/10" : "border-zinc-700/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-zinc-600 hover:text-zinc-400">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <a
            href={`/dashboard/leads/${lead.id}`}
            className="font-medium text-zinc-100 hover:text-zinc-300 hover:underline"
          >
            {lead.name}
          </a>
          <div className="mt-0.5 text-xs text-zinc-500">
            {lead.phone || lead.email || "—"}
          </div>
        </div>
        {lead.score !== null && lead.score !== undefined && (
          <span
            className={`h-5 w-7 rounded text-center text-[10px] font-bold leading-5 tabular-nums ${
              lead.score >= 67 ? "bg-red-500/10 text-red-400" :
              lead.score >= 34 ? "bg-amber-500/10 text-amber-400" :
              "bg-blue-500/10 text-blue-400"
            }`}
          >
            {lead.score}
          </span>
        )}
      </div>
      {lead.tags && lead.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-[10px] text-zinc-400">{t}</span>
          ))}
          {lead.tags.length > 2 && (
            <span className="text-[10px] text-zinc-600">+{lead.tags.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Column({
  status,
  leads,
  activeId,
}: {
  status: string;
  leads: Lead[];
  activeId: string | null;
}) {
  const validLeads = leads.filter((l) => l.id !== activeId);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold capitalize text-zinc-200">{status}</h3>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{validLeads.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[calc(100vh-16rem)]">
        <SortableContext items={validLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {validLeads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {validLeads.length === 0 && (
          <div className="py-8 text-center text-xs text-zinc-600">No leads</div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ leads, statuses, onRefresh }: KanbanBoardProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !active) return;

    const leadId = active.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const overId = over.id as string;
    let targetStatus: string | null = null;

    if (statuses.includes(overId)) {
      targetStatus = overId;
    } else {
      const overLead = leads.find((l) => l.id === overId);
      if (overLead) targetStatus = overLead.status;
    }

    if (targetStatus && targetStatus !== lead.status) {
      try {
        await fetch("/api/leads/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: leadId, status: targetStatus }),
        });
        onRefresh();
        router.refresh();
      } catch {
        // ignore
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <Column key={status} status={status} leads={leads} activeId={activeId} />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <div className="rounded-lg border border-emerald-500/50 bg-zinc-800 p-3 text-sm shadow-xl">
            <div className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 text-zinc-600" />
              <span className="font-medium text-zinc-100">{activeLead.name}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
