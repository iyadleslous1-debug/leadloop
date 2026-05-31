"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { CsvImportModal } from "@/components/leads/CsvImportModal";

export function CsvImportButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </button>
      <CsvImportModal open={open} onClose={() => setOpen(false)} onDone={() => { router.refresh(); setOpen(false); }} />
    </>
  );
}
