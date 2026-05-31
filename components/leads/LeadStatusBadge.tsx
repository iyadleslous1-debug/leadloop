const STATUS_STYLES: Record<string, string> = {
  hot: "bg-red-500/10 text-red-400 border-red-500/20",
  warm: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  cold: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  new: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  qualified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
};

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status.toLowerCase()] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

interface LeadStatusBadgeProps {
  status: string;
  score?: number | null;
}

export function LeadStatusBadge({ status, score }: LeadStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusStyle(status)}`}
    >
      {score !== undefined && score !== null && (
        <span className="tabular-nums">{score}</span>
      )}
      {status.replace("_", " ")}
    </span>
  );
}
