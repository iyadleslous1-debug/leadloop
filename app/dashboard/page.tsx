import { Users, Flame, Thermometer, TrendingUp, Building2, Rocket } from "lucide-react";
import Link from "next/link";
import { getLeads, getLeadStats } from "@/services/leads";
import { getProperties, getPropertyStats } from "@/services/properties";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LeadTable } from "@/components/leads/LeadTable";
import type { Lead } from "@/types/lead";
import type { Property } from "@/types/property";

export default async function DashboardPage() {
  const init = await Promise.all([
    getLeads().catch(() => ({ leads: [] as Lead[], total: 0, page: 1, totalPages: 0 })),
    getLeadStats().catch(() => ({ total: 0, hot: 0, warm: 0, cold: 0, averageScore: 0 })),
    getProperties().catch(() => ({ properties: [] as Property[], total: 0, page: 1, totalPages: 0 })),
    getPropertyStats().catch(() => ({ total: 0, types: {} as Record<string, number> })),
  ]);
  const [leadsResult, leadStats, propResult, propStats] = init;
  const properties = propResult.properties;
  const leads = leadsResult.leads;
  const recentLeads = leads.slice(0, 5);
  const recentProperties = properties.slice(0, 3);

  const hasNoData = properties.length === 0 && leads.length === 0;

  if (hasNoData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
          <Rocket className="h-8 w-8 text-zinc-100" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-zinc-100">
          Welcome to LeadLoop!
        </h1>
        <p className="mb-8 max-w-sm text-sm text-zinc-500">
          Your AI-powered WhatsApp assistant is ready. Let us get you set up in 2 minutes.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          <Rocket className="h-4 w-4" />
          Get Started
        </Link>
        <p className="mt-4 text-xs text-zinc-600">
          Connect WhatsApp and add your first properties to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Leads"
          value={leadStats.total}
          icon={Users}
          color="bg-zinc-800 text-zinc-300"
        />
        <StatsCard
          label="Hot"
          value={leadStats.hot}
          icon={Flame}
          color="bg-red-500/10 text-red-400"
        />
        <StatsCard
          label="Warm"
          value={leadStats.warm}
          icon={Thermometer}
          color="bg-amber-500/10 text-amber-400"
        />
        <StatsCard
          label="Avg Score"
          value={leadStats.averageScore}
          icon={TrendingUp}
          color="bg-violet-500/10 text-violet-400"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Properties"
          value={propStats.total}
          icon={Building2}
          color="bg-zinc-800 text-zinc-300"
        />
        {Object.entries(propStats.types).slice(0, 2).map(([type, count]) => (
          <StatsCard
            key={type}
            label={type.charAt(0).toUpperCase() + type.slice(1)}
            value={count}
            icon={Building2}
            color="bg-zinc-800/50 text-zinc-400"
          />
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          Recent Leads
        </h2>
        {recentLeads.length > 0 ? (
          <LeadTable leads={recentLeads} />
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">
            No leads yet. Create your first lead to get started.
          </p>
        )}
      </div>

      {recentProperties.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">
            Recent Properties
          </h2>
          <div className="space-y-2">
            {recentProperties.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800/50 px-4 py-2.5"
              >
                <div>
                  <span className="text-sm font-medium text-zinc-100">{p.title}</span>
                  <span className="ml-2 text-xs text-zinc-500">{p.city}</span>
                </div>
                <span className="text-sm text-zinc-400">
                  ${p.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
