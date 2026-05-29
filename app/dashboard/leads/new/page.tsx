import { Plus } from "lucide-react";
import { LeadForm } from "@/components/leads/LeadForm";

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Plus className="h-5 w-5 text-zinc-400" />
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">New Lead</h2>
          <p className="text-sm text-zinc-500">Add a manual lead entry</p>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <LeadForm />
      </div>
    </div>
  );
}
