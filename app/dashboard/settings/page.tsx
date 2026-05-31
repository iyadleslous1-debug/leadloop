"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
        <p className="text-sm text-zinc-500">Connect your WhatsApp and configure integrations</p>
      </div>

      <TwilioWhatsAppSettings />
      <AIInstructionsSettings />
      <LeadStatusSettings />
      <FollowUpSettings />
      <FollowUpSequenceSettings />
      <TeamMembersSettings />
      <DangerZone />
    </div>
  );
}

function AIInstructionsSettings() {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setInstructions(data.ai_instructions || "");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_instructions: instructions }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("AI instructions saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">AI Reply Instructions</h3>
        <p className="text-xs text-zinc-500">
          Tell the AI how to talk to your buyers. Set tone, rules, or anything specific to your agency.
        </p>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-lg bg-zinc-800" />
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            placeholder="e.g. Always be formal. Mention we have 15+ years in Algiers real estate. Never share prices without a phone number. Always offer a free visit."
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-600">
              These instructions are sent to the AI on every WhatsApp reply.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TwilioWhatsAppSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState({
    twilio_account_sid: "",
    twilio_auth_token: "",
    twilio_whatsapp_from: "",
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/integrations/twilio");
        if (res.ok) {
          const data = await res.json();
          if (data.integration) {
            setCreds((prev) => ({
              ...prev,
              twilio_account_sid: data.integration.twilio_account_sid || "",
              twilio_whatsapp_from: data.integration.twilio_whatsapp_from || "",
            }));
            setConnected(true);
          }
        }
      } catch {
        // not connected
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/twilio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to connect");
      }
      setConnected(true);
      toast.success(data.message || "WhatsApp connected!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setCreds({ twilio_account_sid: "", twilio_auth_token: "", twilio_whatsapp_from: "" });
    setConnected(false);
    try {
      const res = await fetch("/api/integrations/twilio", { method: "DELETE" });
      if (res.ok) toast.success("Disconnected");
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="h-4 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="mt-4 space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">WhatsApp via Twilio</h3>
          <p className="text-xs text-zinc-500">
            Get these from your{" "}
            <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline">
              Twilio Console
            </a>
          </p>
        </div>
        {connected && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400">Account SID</label>
          <input
            type="text"
            value={creds.twilio_account_sid}
            onChange={(e) => setCreds((p) => ({ ...p, twilio_account_sid: e.target.value }))}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400">Auth Token</label>
          <input
            type="password"
            value={creds.twilio_auth_token}
            onChange={(e) => setCreds((p) => ({ ...p, twilio_auth_token: e.target.value }))}
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400">WhatsApp Number</label>
          <input
            type="text"
            value={creds.twilio_whatsapp_from}
            onChange={(e) => setCreds((p) => ({ ...p, twilio_whatsapp_from: e.target.value }))}
            placeholder="+14155238886"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            required
          />
        </div>

        {connected && (() => {
          const url = `${window.location.origin}/api/whatsapp/webhook`;
          return (
            <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2">
              <p className="text-xs text-zinc-500">Webhook URL</p>
              <code className="text-xs text-zinc-300 break-all">{url}</code>
            </div>
          );
        })()}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? "Connecting..." : connected ? "Update" : "Connect"}
          </button>
          {connected && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-300"
            >
              Disconnect
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function FollowUpSettings() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.auto_follow_ups !== false);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleToggle() {
    const newVal = !enabled;
    setEnabled(newVal);
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_follow_ups: newVal }),
      });
      toast.success(newVal ? "Auto follow-ups enabled" : "Auto follow-ups disabled");
    } catch {
      toast.error("Failed to update");
      setEnabled(!newVal);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Auto Follow-ups</h3>
          <p className="text-xs text-zinc-500">
            Automatically send drip messages to hot leads (day 1, 3, 7, weeks 2-8)
          </p>
        </div>
        {loading ? (
          <div className="h-6 w-10 animate-pulse rounded-full bg-zinc-800" />
        ) : (
          <button
            type="button"
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
              enabled ? "bg-emerald-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

function FollowUpSequenceSettings() {
  const [sequences, setSequences] = useState<{ id: string; name: string; steps?: { id: string; delay_days: number; message: string }[] }[]>([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [steps, setSteps] = useState<{ delay_days: number; message: string }[]>([{ delay_days: 1, message: "" }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sequences")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setSequences(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), steps: steps.filter((s) => s.message.trim()) }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const seq = await res.json();
      setSequences((prev) => [seq, ...prev]);
      setNewName("");
      setSteps([{ delay_days: 1, message: "" }]);
      setEditing(null);
      toast.success("Sequence created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/sequences?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSequences((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sequence deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const addStep = () => {
    const lastDelay = steps.length > 0 ? steps[steps.length - 1].delay_days : 0;
    setSteps((prev) => [...prev, { delay_days: lastDelay + 1, message: "" }]);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Follow-up Sequences</h3>
        <p className="text-xs text-zinc-500">Create custom follow-up drip campaigns for your leads</p>
      </div>

      <form onSubmit={handleCreate} className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. 30-day luxury buyer sequence"
            className="block flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            Create
          </button>
        </div>
        {newName.trim() && (
          <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 p-3 space-y-2">
            <p className="text-xs font-medium text-zinc-500">Steps (delay in days):</p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={step.delay_days}
                  onChange={(e) => {
                    const newSteps = [...steps];
                    newSteps[i].delay_days = parseInt(e.target.value) || 1;
                    setSteps(newSteps);
                  }}
                  className="w-16 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
                <input
                  type="text"
                  value={step.message}
                  onChange={(e) => {
                    const newSteps = [...steps];
                    newSteps[i].message = e.target.value;
                    setSteps(newSteps);
                  }}
                  placeholder="Message text..."
                  className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
                {steps.length > 1 && (
                  <button type="button" onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-zinc-600 hover:text-red-400">&times;</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addStep} className="text-xs text-zinc-500 hover:text-zinc-300">+ Add step</button>
          </div>
        )}
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      ) : sequences.length === 0 ? (
        <p className="text-sm text-zinc-600">No custom sequences yet. Create one above.</p>
      ) : (
        <div className="space-y-2">
          {sequences.map((seq) => (
            <div key={seq.id} className="rounded-lg bg-zinc-950/50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{seq.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(seq.id)}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
              {seq.steps && seq.steps.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {seq.steps.map((st, i) => (
                    <span key={st.id || i} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      Day {st.delay_days}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadStatusSettings() {
  const [statuses, setStatuses] = useState<{ id: string; name: string; color: string; sort_order: number }[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/leads/statuses")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setStatuses(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/leads/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();
      setStatuses((prev) => [...prev, created]);
      setNewName("");
      toast.success("Status created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create status");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/leads/statuses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setStatuses((prev) => prev.filter((s) => s.id !== id));
      toast.success("Status deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-cyan-500"];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Lead Statuses</h3>
        <p className="text-xs text-zinc-500">Create custom lead statuses for your pipeline</p>
      </div>

      <form onSubmit={handleAdd} className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Negotiation"
          className="block flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      ) : statuses.length === 0 ? (
        <p className="text-sm text-zinc-600">No custom statuses yet. Add one above.</p>
      ) : (
        <div className="space-y-1">
          {statuses.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-zinc-950/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${colors[i % colors.length]}`} />
                <span className="text-sm text-zinc-300">{s.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamMembersSettings() {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);

  const canManage = myRole === "owner" || myRole === "admin";

  async function loadTeam() {
    try {
      const res = await fetch("/api/team");
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.members || []);
      setInvites(data.invites || []);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/team");
        if (!res.ok) return;
        const data = await res.json();
        setMembers(data.members || []);
        setInvites(data.invites || []);
        const meRes = await fetch("/api/profile");
        if (meRes.ok) {
          const me = await meRes.json();
          setMyRole(me.role);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to send invite");
        return;
      }
      toast.success("Invite sent!");
      setEmail("");
      await loadTeam();
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setSending(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this member from your agency?")) return;
    try {
      const res = await fetch(`/api/team?memberId=${memberId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to remove"); return; }
      toast.success("Member removed");
      await loadTeam();
    } catch { toast.error("Failed to remove"); }
  }

  if (loading) return <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-500">Loading team...</p></div>;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">Team Members</h3>
      <p className="mb-4 text-xs text-zinc-500">
        Invite teammates to your agency. Roles: Admin (full access), Agent (manage leads), Viewer (read-only).
      </p>

      <div className="mb-4 space-y-2">
        {members.map((m: any) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
            <div>
              <p className="text-sm text-zinc-200">{m.name || m.email || m.id?.slice(0, 8)}</p>
              <p className="text-xs text-zinc-500 capitalize">{m.role}</p>
            </div>
            {myRole === "owner" && m.role !== "owner" && (
              <button onClick={() => handleRemove(m.id)} className="text-xs text-red-400 hover:text-red-300">
                Remove
              </button>
            )}
          </div>
        ))}
        {invites.map((inv: any) => (
          <div key={inv.id} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2 opacity-60">
            <div>
              <p className="text-sm text-zinc-400">{inv.email}</p>
              <p className="text-xs text-zinc-500 capitalize">{inv.role} — pending</p>
            </div>
          </div>
        ))}
      </div>

      {canManage && (
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-zinc-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@agency.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Invite"}
          </button>
        </form>
      )}
    </div>
  );
}

function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      toast.success("Account deleted");
      document.cookie = "sb-access-token=; path=/; max-age=0";
      document.cookie = "sb-refresh-token=; path=/; max-age=0";
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5">
      <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Permanently delete your account and all data. This action cannot be undone.
      </p>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={deleting}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete Account"}
      </button>

      {confirming && (
        <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-4">
          <p className="text-sm text-red-300">
            Are you absolutely sure? All leads, properties, conversations, and settings will be permanently removed.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete everything"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
