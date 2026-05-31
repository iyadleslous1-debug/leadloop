"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface ConversationSummaryProps {
  conversationId: string;
  initialSummary: string | null;
}

export function ConversationSummary({ conversationId, initialSummary }: ConversationSummaryProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  if (!summary && loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
        <span className="text-sm text-zinc-500">Generating summary...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <button
        onClick={async () => {
          setLoading(true);
          try {
            const res = await fetch(`/api/conversations/${conversationId}/summarize`, { method: "POST" });
            if (!res.ok) return;
            const data = await res.json();
            setSummary(data.summary);
          } catch {} finally {
            setLoading(false);
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generate Summary
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-medium text-zinc-400">AI Summary</span>
        </div>
        <span className="text-xs text-zinc-600">{collapsed ? "Show" : "Hide"}</span>
      </button>
      {!collapsed && (
        <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">{summary}</p>
      )}
    </div>
  );
}
