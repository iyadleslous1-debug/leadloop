import { Users, Flame, Thermometer, Snowflake, Building2 } from "lucide-react";
import { getLeads, getLeadStats } from "@/services/leads";
import { getProperties, getPropertyStats } from "@/services/properties";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LeadTable } from "@/components/leads/LeadTable";

export default async function DashboardPage() {
  const [leads, leadStats, properties, propStats] = await Promise.all([
    getLeads(),
    getLeadStats(),
    getProperties(),
    getPropertyStats(),
  ]);
  const recentLeads = leads.slice(0, 5);
  const recentProperties = properties.slice(0, 3);

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
          label="Cold"
          value={leadStats.cold}
          icon={Snowflake}
          color="bg-blue-500/10 text-blue-400"
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
