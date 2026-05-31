"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle, Clock, type LucideIcon } from "lucide-react";
import type { FollowUp, FollowUpType } from "@/types/follow-up";

const typeIcons: Record<FollowUpType, LucideIcon> = {
  suggestion: Clock,
  reminder: Clock,
  update: Clock,
  custom: Clock,
};

const typeLabels: Record<FollowUpType, string> = {
  suggestion: "Suggestion",
  reminder: "Reminder",
  update: "Update",
  custom: "Custom",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.round(diff / 86400000);
}

interface FollowUpRowProps {
  followUp: FollowUp & { lead: { name: string } | null };
  onToggle: (id: string, completed: boolean) => void;
  toggling: boolean;
}

function FollowUpRow({ followUp, onToggle, toggling }: FollowUpRowProps) {
  const Icon = typeIcons[followUp.type];
  const days = daysUntil(followUp.scheduled_at);
  const overdue = !followUp.completed && days < 0;
  const today = !followUp.completed && days === 0;

  return (
    <tr className={`border-b border-zinc-800 transition-colors hover:bg-zinc-800/50 ${followUp.completed ? "opacity-50" : ""}`}>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggle(followUp.id, !followUp.completed)}
          disabled={toggling}
          className="text-zinc-500 hover:text-emerald-400 disabled:opacity-40"
          title={followUp.completed ? "Mark incomplete" : "Mark complete"}
        >
          {followUp.completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-100">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-zinc-500" />
          <span className="font-medium">{typeLabels[followUp.type]}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-300">
        {followUp.lead?.name || "Unknown"}
      </td>
      <td className="max-w-xs truncate px-4 py-3 text-sm text-zinc-400">
        {followUp.message}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={overdue ? "text-red-400" : today ? "text-amber-400" : "text-zinc-400"}>
          {formatDate(followUp.scheduled_at)}
        </span>
        {!followUp.completed && (
          <span className={`ml-2 text-xs ${overdue ? "text-red-400" : "text-zinc-500"}`}>
            {overdue ? `${Math.abs(days)}d overdue` : today ? "Today" : `in ${days}d`}
          </span>
        )}
      </td>
    </tr>
  );
}

interface FollowUpTableProps {
  followUps: (FollowUp & { lead: { name: string } | null })[];
}

export function FollowUpTable({ followUps }: FollowUpTableProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(id: string, completed: boolean) {
    setTogglingId(id);
    try {
      await fetch("/api/follow-ups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      });
      router.refresh();
    } catch {
      console.error("Failed to update follow-up");
    } finally {
      setTogglingId(null);
    }
  }

  const sorted = [...followUps].sort((a, b) =>
    a.completed === b.completed
      ? new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      : a.completed ? 1 : -1
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-700 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-2 w-10" />
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Lead</th>
            <th className="px-4 py-2">Message</th>
            <th className="px-4 py-2">Scheduled</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((fu) => (
            <FollowUpRow
              key={fu.id}
              followUp={fu}
              onToggle={handleToggle}
              toggling={togglingId === fu.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
