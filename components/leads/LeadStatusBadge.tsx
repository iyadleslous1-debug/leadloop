import type { LeadStatus } from "@/types/lead";

const styles: Record<LeadStatus, string> = {
  hot: "bg-red-500/10 text-red-400 border-red-500/20",
  warm: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  cold: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
