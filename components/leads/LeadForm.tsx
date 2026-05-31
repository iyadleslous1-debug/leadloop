"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Lead, LeadFormData, LeadSource, LeadStatusConfig, ScoreBreakdown } from "@/types/lead";
import { TagInput } from "@/components/ui/TagInput";

const LEAD_SOURCES: LeadSource[] = ["whatsapp", "website", "referral", "manual", "import"];

interface LeadFormProps {
  lead?: Lead;
}

export function LeadForm({ lead }: LeadFormProps) {
  const router = useRouter();
  const [customStatuses, setCustomStatuses] = useState<LeadStatusConfig[]>([]);
  const [name, setName] = useState(lead?.name || "");
  const [phone, setPhone] = useState(lead?.phone || "");
  const [email, setEmail] = useState(lead?.email || "");
  const [status, setStatus] = useState(lead?.status || "cold");
  const [source, setSource] = useState<LeadSource>(lead?.source || "manual");
  const [tags, setTags] = useState<string[]>(lead?.tags || []);
  const [notes, setNotes] = useState(lead?.notes || "");
  const [assignedTo, setAssignedTo] = useState(lead?.assigned_to || "");
  const [reminderAt, setReminderAt] = useState(lead?.reminder_at?.slice(0, 16) || "");
  const [sequenceId, setSequenceId] = useState(lead?.sequence_id || "");
  const [dealValue, setDealValue] = useState(lead?.deal_value?.toString() || "");
  const [closeDate, setCloseDate] = useState(lead?.close_date?.slice(0, 10) || "");
  const [dealStage, setDealStage] = useState(lead?.deal_stage || "");
  const [sequences, setSequences] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const autoFillRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch("/api/leads/statuses")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setCustomStatuses(data); })
      .catch(() => {});
    fetch("/api/sequences")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setSequences(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEditing || !phone.trim()) return;
    if (autoFillRef.current) clearTimeout(autoFillRef.current);
    if (phone.trim().length < 4) return;
    autoFillRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/leads/lookup?phone=${encodeURIComponent(phone.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.name && !name) setName(data.name);
        if (data && data.email && !email) setEmail(data.email || "");
        if (data && data.notes && !notes) setNotes(data.notes || "");
      } catch {}
    }, 600);
  }, [phone]);

  const isEditing = !!lead;

  async function handleSubmit() {
    setLoading(true);

    try {
      if (!name.trim()) {
        toast.error("Name is required");
        setLoading(false);
        return;
      }

      const body: LeadFormData = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        status,
        source,
        tags: tags.length > 0 ? tags : undefined,
        notes: notes.trim() || undefined,
        assigned_to: assignedTo.trim() || undefined,
        reminder_at: reminderAt ? new Date(reminderAt).toISOString() : undefined,
        sequence_id: sequenceId || undefined,
        deal_value: dealValue ? parseFloat(dealValue) : null,
        close_date: closeDate ? new Date(closeDate).toISOString() : null,
        deal_stage: dealStage || null,
      };

      const url = isEditing ? `/api/leads/${lead.id}` : "/api/leads";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      toast.success(isEditing ? "Lead updated" : "Lead created");
      router.push("/dashboard/leads");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
            Name <span className="text-zinc-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-zinc-300">
            Status <span className="text-zinc-500">*</span>
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
            {customStatuses.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="+971501234567"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="john@example.com"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="assigned_to" className="block text-sm font-medium text-zinc-300">
            Assigned To
          </label>
          <input
            id="assigned_to"
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="Agent name or email"
          />
        </div>
        <div>
          <label htmlFor="reminder_at" className="block text-sm font-medium text-zinc-300">
            Reminder
          </label>
          <input
            id="reminder_at"
            type="datetime-local"
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
        <div>
          <label htmlFor="sequence_id" className="block text-sm font-medium text-zinc-300">
            Follow-up Sequence
          </label>
          <select
            id="sequence_id"
            value={sequenceId}
            onChange={(e) => setSequenceId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            <option value="">Default (Day 1, 3, 7, Weeks 2-8)</option>
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Tags</label>
        <TagInput tags={tags} onChange={setTags} placeholder="e.g. vip, budget-friendly, urgent" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="deal_value" className="block text-sm font-medium text-zinc-300">
            Deal Value ($)
          </label>
          <input
            id="deal_value"
            type="number"
            min="0"
            step="0.01"
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="250000"
          />
        </div>
        <div>
          <label htmlFor="close_date" className="block text-sm font-medium text-zinc-300">
            Expected Close Date
          </label>
          <input
            id="close_date"
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
        <div>
          <label htmlFor="deal_stage" className="block text-sm font-medium text-zinc-300">
            Deal Stage
          </label>
          <select
            id="deal_stage"
            value={dealStage}
            onChange={(e) => setDealStage(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            <option value="">No stage</option>
            <option value="negotiation">Negotiation</option>
            <option value="offer">Offer Made</option>
            <option value="inspection">Inspection</option>
            <option value="financing">Financing</option>
            <option value="closing">Closing</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="source" className="block text-sm font-medium text-zinc-300">
          Source
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value as LeadSource)}
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-300">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="Lead preferences, follow-up notes..."
        />
      </div>

      {isEditing && lead?.score !== null && lead?.score !== undefined && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-zinc-300">Lead Score Breakdown</h4>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-zinc-100">{lead.score}</span>
            <span className="text-xs text-zinc-500">/ 100</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all ${
                  (lead.score || 0) >= 67 ? "bg-red-500" : (lead.score || 0) >= 34 ? "bg-amber-500" : "bg-blue-500"
                }`}
                style={{ width: `${lead.score || 0}%` }}
              />
            </div>
          </div>
          {lead.score_breakdown && (
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { label: "Intent", value: lead.score_breakdown.intent, max: 30 },
                { label: "Recency", value: lead.score_breakdown.recency, max: 25 },
                { label: "Engagement", value: lead.score_breakdown.engagement, max: 20 },
                { label: "Property", value: lead.score_breakdown.propertyMatch, max: 15 },
                { label: "Follow-up", value: lead.score_breakdown.followUp, max: 10 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 text-zinc-500">{item.label}</div>
                  <div className="font-medium text-zinc-100">
                    {item.value}/{item.max}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{ cursor: loading ? "not-allowed" : "pointer" }}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEditing ? "Update Lead" : "Add Lead"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
