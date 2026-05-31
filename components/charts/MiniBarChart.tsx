interface BarItem {
  label: string;
  value: number;
  color?: string;
}

const COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-lime-500",
];

export function MiniBarChart({ items, maxLabel }: { items: BarItem[]; maxLabel?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className={`w-${maxLabel === "short" ? "16" : "20"} truncate text-sm text-zinc-300 shrink-0`}>
            {item.label}
          </span>
          <div className="flex-1 h-5 rounded bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded transition-all ${item.color || COLORS[idx % COLORS.length]}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-sm font-medium text-zinc-100 tabular-nums shrink-0">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
