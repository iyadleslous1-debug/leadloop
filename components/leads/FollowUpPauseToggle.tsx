"use client";

import { useState } from "react";
import { PauseCircle, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";

interface FollowUpPauseToggleProps {
  leadId: string;
  paused: boolean;
}

export function FollowUpPauseToggle({ leadId, paused: initial }: FollowUpPauseToggleProps) {
  const [paused, setPaused] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    const newVal = !paused;
    setPaused(newVal);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow_ups_paused: newVal }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(newVal ? "Follow-ups paused" : "Follow-ups resumed");
    } catch {
      setPaused(!newVal);
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-800 disabled:opacity-50"
    >
      {paused ? (
        <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <PauseCircle className="h-3.5 w-3.5 text-amber-400" />
      )}
      {paused ? "Resume Follow-ups" : "Pause Follow-ups"}
    </button>
  );
}
