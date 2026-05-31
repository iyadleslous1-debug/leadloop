"use client";

import { useEffect, useState } from "react";
import {
  Users, Building2, Flame, MessageCircle, Bot,
  AlertTriangle, Smartphone, TrendingUp, Clock,
  CheckCircle2, AlertCircle, BarChart3, Shield,
  RefreshCw,
} from "lucide-react";
import type { AdminStats } from "@/services/admin/stats";

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.ok ? r.json() : Promise.reject("Forbidden"))
      .then(setStats)
      .catch(() => setError("Access denied"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-zinc-500">Loading admin panel...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.users.total, sub: `${stats.users.newThisMonth} this month`, icon: Users, color: "bg-blue-500/10 text-blue-400" },
    { label: "Agencies (Twilio)", value: stats.agencies.withTwilio, sub: `${stats.agencies.total} active`, icon: Smartphone, color: "bg-green-500/10 text-green-400" },
    { label: "Total Properties", value: stats.properties.total, icon: Building2, color: "bg-zinc-800 text-zinc-300" },
    { label: "Total Leads", value: stats.leads.total, sub: `${stats.leads.thisMonth} this month`, icon: Users, color: "bg-violet-500/10 text-violet-400" },
    { label: "Hot Leads", value: stats.leads.hot, icon: Flame, color: "bg-red-500/10 text-red-400" },
    { label: "Avg Score", value: stats.leads.averageScore, icon: TrendingUp, color: "bg-amber-500/10 text-amber-400" },
    { label: "AI Replies", value: stats.aiUsage.totalReplies, sub: `${stats.aiUsage.uniqueConversations} conversations`, icon: Bot, color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Messages Today", value: stats.messages.today, icon: MessageCircle, color: "bg-cyan-500/10 text-cyan-400" },
    { label: "Active Conversations", value: stats.conversations.active, icon: MessageCircle, color: "bg-zinc-800 text-zinc-300" },
    { label: "Follow-ups Pending", value: stats.followUps.pending, icon: Clock, color: "bg-amber-500/10 text-amber-400" },
    { label: "Completed", value: stats.followUps.completed, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Overdue", value: stats.followUps.overdue, icon: AlertCircle, color: "bg-red-500/10 text-red-400" },
  ];

  const leadsBreakdown = [
    { label: "Hot", value: stats.leads.hot, total: stats.leads.total, color: "bg-red-500" },
    { label: "Warm", value: stats.leads.warm, total: stats.leads.total, color: "bg-amber-500" },
    { label: "Cold", value: stats.leads.cold, total: stats.leads.total, color: "bg-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <Shield className="h-5 w-5" /> Admin Dashboard
          </h2>
          <p className="text-sm text-zinc-500">Global platform overview — all agencies, all users</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          {stats.errors.total} errors logged ({stats.errors.last24h} in last 24h)
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-400">{c.label}</p>
              <div className={`rounded-lg p-2 ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-zinc-100">{c.value}</p>
            {c.sub && <p className="mt-0.5 text-xs text-zinc-500">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <BarChart3 className="h-4 w-4" /> Lead Status Breakdown
          </h3>
          {stats.leads.total > 0 ? (
            <div className="space-y-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
                {leadsBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className={`${item.color} transition-all`}
                    style={{ width: `${(item.value / item.total) * 100}%` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {leadsBreakdown.map((item) => (
                  <div key={item.label}>
                    <span className="font-medium text-zinc-100">{item.value}</span>
                    <span className="ml-1 text-zinc-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-zinc-500">No leads yet</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Smartphone className="h-4 w-4" /> Twilio Agencies
          </h3>
          {stats.twilioUsage.length > 0 ? (
            <div className="space-y-2">
              {stats.twilioUsage.map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-sm text-zinc-300">{t.phone}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{t.conversationCount} conversations</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-zinc-500">No agencies connected yet</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <AlertTriangle className="h-4 w-4 text-red-400" /> Recent Errors
        </h3>
        {stats.errors.recent.length > 0 ? (
          <div className="space-y-1.5">
            {stats.errors.recent.map((e) => (
              <div key={e.id} className="flex items-start justify-between rounded-lg border border-zinc-800/50 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-400">{e.context}</span>
                  <span className="text-zinc-400">{e.message?.slice(0, 80)}</span>
                </div>
                <span className="shrink-0 text-xs text-zinc-600">{new Date(e.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-zinc-500">No errors logged — clean!</p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <RefreshCw className="h-4 w-4 text-amber-400" /> Delivery Queue
          <span className="ml-auto rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
            {stats.deliveryQueue.pending} pending
          </span>
        </h3>
        {stats.deliveryQueue.pending > 0 ? (
          <p className="text-sm text-zinc-400">
            {stats.deliveryQueue.pending} message{stats.deliveryQueue.pending !== 1 ? "s" : ""} failed delivery.
            Visit <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">/api/admin/delivery-queue</code> to retry.
          </p>
        ) : (
          <p className="py-4 text-center text-sm text-zinc-500">No failed deliveries — all messages sending cleanly</p>
        )}
      </div>
    </div>
  );
}
