"use client";

import { useRouter, usePathname } from "next/navigation";
import type { LeadStatus } from "@/types/lead";

const statuses: { label: string; value: LeadStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Hot", value: "hot" },
  { label: "Warm", value: "warm" },
  { label: "Cold", value: "cold" },
];

export function LeadStatusFilter({ current }: { current: LeadStatus | undefined }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleFilter(value: LeadStatus | undefined) {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-2">
      {statuses.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => handleFilter(s.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            current === s.value
              ? "bg-zinc-200 text-zinc-900"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
