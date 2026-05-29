import type { PropertyType } from "@/types/property";

const styles: Record<PropertyType, string> = {
  villa: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  apartment: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  house: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  land: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  commercial: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function PropertyBadge({ type }: { type: PropertyType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[type]}`}
    >
      {type}
    </span>
  );
}
