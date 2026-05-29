import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadForm } from "@/components/leads/LeadForm";
import type { Lead } from "@/types/lead";

interface EditLeadPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLeadPage({ params }: EditLeadPageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("id", id).single();
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Edit Lead</h2>
        <p className="text-sm text-zinc-500">Update lead information</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <LeadForm lead={lead as Lead} />
      </div>
    </div>
  );
}
