import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <BarChart3 className="h-12 w-12 text-zinc-600" />
      <h2 className="mt-4 text-lg font-semibold text-zinc-100">
        Analytics Coming Soon
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        Track your lead conversion and follow-up performance.
      </p>
    </div>
  );
}
