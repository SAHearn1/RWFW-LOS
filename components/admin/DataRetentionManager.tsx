"use client";

import { useState } from "react";

type RetentionResult = {
  action: string;
  purged: number;
  doneAtIso: string;
};

export default function DataRetentionManager() {
  const [cutoffDate, setCutoffDate] = useState("");
  const [learnerId, setLearnerId] = useState("");
  const [purgeStatus, setPurgeStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePurgeBefore() {
    if (!cutoffDate.trim()) {
      setPurgeStatus({ type: "error", message: "Cutoff date is required." });
      return;
    }

    const cutoffIso = new Date(cutoffDate).toISOString();
    setLoading(true);
    setPurgeStatus(null);

    try {
      const response = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "purge_before", cutoffIso }),
      });

      const payload = (await response.json()) as RetentionResult & { error?: string };

      if (!response.ok) {
        setPurgeStatus({ type: "error", message: payload.error ?? `Request failed (${response.status})` });
        return;
      }

      setPurgeStatus({
        type: "success",
        message: `Purged ${payload.purged} record${payload.purged !== 1 ? "s" : ""} before ${cutoffDate}. Completed at ${new Date(payload.doneAtIso).toLocaleString()}.`,
      });
      setCutoffDate("");
    } catch {
      setPurgeStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLearner() {
    if (!learnerId.trim()) {
      setDeleteStatus({ type: "error", message: "Learner ID is required." });
      return;
    }

    setLoading(true);
    setDeleteStatus(null);

    try {
      const response = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete_learner", learnerId: learnerId.trim() }),
      });

      const payload = (await response.json()) as RetentionResult & { error?: string };

      if (!response.ok) {
        setDeleteStatus({ type: "error", message: payload.error ?? `Request failed (${response.status})` });
        return;
      }

      setDeleteStatus({
        type: "success",
        message: `Deleted ${payload.purged} record${payload.purged !== 1 ? "s" : ""} for learner "${learnerId.trim()}". Completed at ${new Date(payload.doneAtIso).toLocaleString()}.`,
      });
      setLearnerId("");
    } catch {
      setDeleteStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Data Retention</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Manage learner data lifecycle and compliance with retention policies. These actions are permanent
        and are recorded in the audit log.
      </p>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">Destructive operations</p>
        <p className="mt-1">
          Purge and delete actions permanently remove ledger records. Ensure DB ledger is enabled
          ({" "}<code>NEXT_PUBLIC_ENABLE_DB_LEDGER=true</code>) before performing retention actions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Purge Before Date */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-semibold text-slate-900">Purge Records Before Date</h2>
          <p className="mt-1 text-xs text-slate-600">
            Permanently deletes all ledger records updated before the specified date. Used for data
            retention schedule compliance.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="cutoff-date" className="block text-xs font-medium text-slate-700">
                Cutoff Date
              </label>
              <input
                id="cutoff-date"
                type="date"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={cutoffDate}
                onChange={(e) => { setCutoffDate(e.target.value); setPurgeStatus(null); }}
                disabled={loading}
              />
            </div>
            {purgeStatus && (
              <p className={`text-xs ${purgeStatus.type === "success" ? "text-green-700" : "text-red-600"}`}>
                {purgeStatus.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => { void handlePurgeBefore(); }}
              disabled={loading || !cutoffDate.trim()}
              className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              {loading ? "Processing…" : "Purge Records"}
            </button>
          </div>
        </div>

        {/* Delete Learner Records */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-semibold text-slate-900">Delete Learner Records (GDPR)</h2>
          <p className="mt-1 text-xs text-slate-600">
            Permanently deletes all ledger records for a specific learner. Used for GDPR right-to-erasure
            requests.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="learner-id" className="block text-xs font-medium text-slate-700">
                Learner ID (Clerk user ID)
              </label>
              <input
                id="learner-id"
                type="text"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                placeholder="user_xxxxxxxxxxxxxxxx"
                value={learnerId}
                onChange={(e) => { setLearnerId(e.target.value); setDeleteStatus(null); }}
                disabled={loading}
              />
            </div>
            {deleteStatus && (
              <p className={`text-xs ${deleteStatus.type === "success" ? "text-green-700" : "text-red-600"}`}>
                {deleteStatus.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => { void handleDeleteLearner(); }}
              disabled={loading || !learnerId.trim()}
              className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              {loading ? "Processing…" : "Delete Learner Records"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
