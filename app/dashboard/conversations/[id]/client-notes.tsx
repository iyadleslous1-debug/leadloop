"use client";

import { useState, useRef, useEffect } from "react";
import { StickyNote } from "lucide-react";

interface ClientNotesProps {
  conversationId: string;
  initialNotes: string;
}

export function ClientNotes({ conversationId, initialNotes }: ClientNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  function handleChange(value: string) {
    setNotes(value);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveNotes(value), 1000);
  }

  async function saveNotes(value: string) {
    setSaving(true);
    try {
      await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: conversationId, notes: value }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <StickyNote className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-xs font-medium text-zinc-400">Notes</span>
        {saving && <span className="ml-auto text-[10px] text-zinc-600">saving...</span>}
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
        placeholder="Internal notes about this conversation..."
      />
    </div>
  );
}
