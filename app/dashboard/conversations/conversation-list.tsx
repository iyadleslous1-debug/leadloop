"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, MessageCircle, Bot, Star } from "lucide-react";
import Link from "next/link";
import type { ConversationWithLastMessage } from "@/services/conversations";

const statuses = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Starred", value: "starred" },
  { label: "Archived", value: "archived" },
];

function getStatusColor(status: string) {
  if (status === "hot") return "text-red-400";
  if (status === "warm") return "text-amber-400";
  if (status === "cold") return "text-blue-400";
  return "text-zinc-500";
}

interface ConversationListProps {
  conversations: ConversationWithLastMessage[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  const currentStatus = searchParams.get("status") || "all";
  const currentQuery = searchParams.get("q") || "";

  function handleSearch(val: string) {
    setSearchValue(val);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchValue) params.set("q", searchValue);
    if (currentStatus !== "all") params.set("status", currentStatus);
    const qs = params.toString();
    router.push(qs ? `/dashboard/conversations?${qs}` : "/dashboard/conversations");
  }

  function handleStatusFilter(value: string) {
    const params = new URLSearchParams();
    if (currentQuery) params.set("q", currentQuery);
    if (value !== "all") params.set("status", value);
    const qs = params.toString();
    router.push(qs ? `/dashboard/conversations?${qs}` : "/dashboard/conversations");
  }

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </form>
        <div className="flex items-center gap-1">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleStatusFilter(s.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                currentStatus === s.value
                  ? "bg-zinc-200 text-zinc-900"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {conversations.length > 0 ? (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="group flex items-center justify-between rounded-lg border border-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800/50"
              >
                <Link href={`/dashboard/conversations/${conv.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fetch("/api/conversations", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: conv.id, starred: !conv.starred }),
                      }).then(() => router.refresh());
                    }}
                    className="shrink-0"
                  >
                    <Star
                      className={`h-4 w-4 transition-colors ${
                        conv.starred ? "fill-amber-400 text-amber-400" : "text-zinc-700 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </button>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                    {conv.ai_active ? (
                      <Bot className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                      {conv.contact_name || conv.phone}
                      {conv.ai_active && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                          AI
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {conv.lastMessage || conv.intent || "No messages yet"}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  {conv.intent_score !== null && (
                    <span className={`text-xs font-medium ${getStatusColor(
                      conv.intent_score >= 0.6 ? "hot" : conv.intent_score >= 0.3 ? "warm" : "cold"
                    )}`}>
                      {(conv.intent_score * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-xs text-zinc-500">
                    {new Date(conv.last_message_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              {currentQuery
                ? `No conversations matching "${currentQuery}"`
                : "No conversations yet. Send a test message to get started."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
