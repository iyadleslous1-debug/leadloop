"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onDone: (count: number) => void;
}

export function CsvImportModal({ open, onClose, onDone }: CsvImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (!open) return null;

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import/leads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Import failed");
        return;
      }
      toast.success(`Imported ${data.imported} lead${data.imported !== 1 ? "s" : ""}`);
      onDone(data.imported);
    } catch {
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">Import Leads from CSV</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-600 hover:border-zinc-500"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="mb-3 h-8 w-8 text-zinc-500" />
          <p className="mb-1 text-sm text-zinc-300">Drop CSV file here or click to browse</p>
          <p className="text-xs text-zinc-600">Columns: name, phone, email, status, source, notes, tags</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
          >
            {loading ? "Importing..." : "Select File"}
          </Button>
        </div>
      </div>
    </div>
  );
}
