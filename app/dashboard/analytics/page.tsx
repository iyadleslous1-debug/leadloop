import {
  Users, Flame, Thermometer, Snowflake,
  MessageCircle, Clock, CheckCircle2, AlertCircle,
  BarChart3, Building2, Globe, TrendingUp, Calendar, Timer, DollarSign, Target, Cpu,
} from "lucide-react";
import { getAnalytics } from "@/services/analytics";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { MiniBarChart } from "@/components/charts/MiniBarChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Analytics</h2>
        <p className="text-sm text-zinc-500">Your real estate performance at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Leads" value={data.leads.total} icon={Users} color="bg-zinc-800 text-zinc-300" />
        <StatsCard label="Hot" value={data.leads.hot} icon={Flame} color="bg-red-500/10 text-red-400" />
        <StatsCard label="Warm" value={data.leads.warm} icon={Thermometer} color="bg-amber-500/10 text-amber-400" />
        <StatsCard label="Avg Score" value={data.leads.averageScore} icon={TrendingUp} color="bg-violet-500/10 text-violet-400" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Leads This Week" value={data.leads.thisWeek} icon={BarChart3} color="bg-zinc-800 text-zinc-300" />
        <StatsCard label="Leads This Month" value={data.leads.thisMonth} icon={BarChart3} color="bg-zinc-800 text-zinc-300" />
        <StatsCard label="Active Conversations" value={data.conversations.active} icon={MessageCircle} color="bg-zinc-800 text-zinc-300" />
        <StatsCard label="Messages Today" value={data.messages.today} icon={MessageCircle} color="bg-zinc-800 text-zinc-300" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Follow-ups Pending" value={data.followUps.pending} icon={Clock} color="bg-amber-500/10 text-amber-400" />
        <StatsCard label="Follow-ups Completed" value={data.followUps.completed} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-400" />
        <StatsCard label="Overdue" value={data.followUps.overdue} icon={AlertCircle} color="bg-red-500/10 text-red-400" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Conversion Rate" value={data.leads.conversionRate !== null ? `${data.leads.conversionRate}%` : "—"} icon={Target} color="bg-emerald-500/10 text-emerald-400" />
        <StatsCard label="Pipeline Value" value={data.leads.pipelineValue > 0 ? `$${data.leads.pipelineValue.toLocaleString()}` : "$0"} icon={DollarSign} color="bg-blue-500/10 text-blue-400" />
        <StatsCard
          label="Avg Response Time"
          value={data.messages.avgResponseMinutes !== null ? `${data.messages.avgResponseMinutes}m` : "—"}
          icon={Timer}
          color="bg-zinc-800 text-zinc-300"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="AI Cost (Today)" value={`$${data.aiCost.todayCost.toFixed(6)}`} icon={Cpu} color="bg-zinc-800 text-zinc-300" />
        <StatsCard label="AI Tokens (Today)" value={data.aiCost.todayTokens.toLocaleString()} icon={Cpu} color="bg-zinc-800 text-zinc-300" />
        <StatsCard label="AI Cost (Total)" value={`$${data.aiCost.totalCost.toFixed(4)}`} icon={Cpu} color="bg-zinc-800 text-zinc-300" />
        <StatsCard label="AI Tokens (Total)" value={data.aiCost.totalTokens.toLocaleString()} icon={Cpu} color="bg-zinc-800 text-zinc-300" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Globe className="h-4 w-4" />
            Leads by City
          </h3>
          {data.leads.byCity.length > 0 ? (
            <MiniBarChart items={data.leads.byCity.slice(0, 8).map((c) => ({ label: c.city, value: c.count }))} />
          ) : (
            <p className="py-6 text-center text-sm text-zinc-500">No city data yet</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Building2 className="h-4 w-4" />
            Leads by Source
          </h3>
          {data.leads.bySource.length > 0 ? (
            <MiniBarChart items={data.leads.bySource.map((s) => ({ label: s.source, value: s.count }))} />
          ) : (
            <p className="py-6 text-center text-sm text-zinc-500">No source data yet</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Building2 className="h-4 w-4" />
            Leads by Property Type
          </h3>
          {data.leads.byPropertyType.length > 0 ? (
            <MiniBarChart items={data.leads.byPropertyType.map((t) => ({ label: t.type, value: t.count }))} />
          ) : (
            <p className="py-6 text-center text-sm text-zinc-500">No property link data yet</p>
          )}
        </div>
      </div>

      {data.bookings.items.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Calendar className="h-4 w-4" />
            Upcoming Visits ({data.bookings.upcoming})
          </h3>
          <div className="space-y-2">
            {data.bookings.items.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-zinc-950/50 px-3 py-2">
                <div>
                  <p className="text-sm text-zinc-200">{b.lead?.name || "Unknown"}</p>
                  <p className="text-xs text-zinc-500">{b.property?.title || "No property"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-300">{new Date(b.scheduled_at).toLocaleDateString()}</p>
                  <p className="text-xs text-zinc-500 capitalize">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
