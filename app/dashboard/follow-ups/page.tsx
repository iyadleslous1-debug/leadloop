import { Suspense } from "react";
import { CalendarClock } from "lucide-react";
import { getFollowUps } from "@/services/follow-ups";
import { FollowUpTable } from "./follow-up-table";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const followUps = await getFollowUps().catch(() => []);

  const pendingCount = followUps.filter((f) => !f.completed).length;
  const completedCount = followUps.filter((f) => f.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Follow-ups</h2>
        <p className="text-sm text-zinc-500">
          {followUps.length} total &middot; {pendingCount} pending &middot; {completedCount} completed
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {followUps.length > 0 ? (
          <Suspense fallback={<div className="h-40 animate-pulse rounded bg-zinc-800" />}>
            <FollowUpTable followUps={followUps} />
          </Suspense>
        ) : (
          <div className="py-12 text-center">
            <CalendarClock className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              No follow-ups yet. Hot leads automatically get follow-ups scheduled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
