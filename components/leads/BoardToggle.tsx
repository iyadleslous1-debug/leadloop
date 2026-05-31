"use client";

import { LayoutGrid, Table2 } from "lucide-react";

interface BoardToggleProps {
  view: "table" | "board";
  onChange: (view: "table" | "board") => void;
}

export function BoardToggle({ view, onChange }: BoardToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 p-0.5">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          view === "table"
            ? "bg-zinc-700 text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <Table2 className="h-3.5 w-3.5" />
        Table
      </button>
      <button
        type="button"
        onClick={() => onChange("board")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          view === "board"
            ? "bg-zinc-700 text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Board
      </button>
    </div>
  );
}
