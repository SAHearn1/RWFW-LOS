"use client";

import { useEffect, useState } from "react";

type AuditEntry = {
  traceId: string;
  eventType: string;
  role: string;
  orgId?: string;
  actorId?: string;
  severity: "info" | "warning" | "error";
  metadata?: Record<string, unknown>;
  createdAtIso: string;
};

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
};

export default function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/super-admin/audit-log?limit=200", { cache: "no-store" });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `audit_log_fetch_failed_${response.status}`);
        }
        const payload = (await response.json()) as { entries: AuditEntry[]; total: number };
        if (active) {
          setEntries(payload.entries);
          setTotal(payload.total);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "audit_log_fetch_failed");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = filter.trim()
    ? entries.filter(
        (e) =>
          e.eventType.toLowerCase().includes(filter.toLowerCase()) ||
          e.role.toLowerCase().includes(filter.toLowerCase()) ||
          (e.actorId ?? "").toLowerCase().includes(filter.toLowerCase())
      )
    : entries;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Audit Log</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Browse platform audit events recorded by the system. File logging requires{" "}
        <code>AUDIT_LOG_TO_FILE=true</code>.
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Unable to load audit log ({error}).
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-800">No audit events found.</p>
          <p className="mt-1">
            Set <code>AUDIT_LOG_TO_FILE=true</code> (non-Vercel) to persist audit events for browsing.
            Events are always emitted to stdout.
          </p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <input
              type="text"
              className="w-full max-w-xs rounded border border-slate-300 px-3 py-1.5 text-sm"
              placeholder="Filter by event type, role, actor…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              {filtered.length} of {total} event{total !== 1 ? "s" : ""}
            </p>
          </div>

          <ol className="space-y-2">
            {filtered.map((entry, idx) => (
              <li
                key={`${entry.traceId}-${idx}`}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[entry.severity] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {entry.severity}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-800">{entry.eventType}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{entry.role}</span>
                </div>
                <div className="mt-2 grid grid-cols-[100px_1fr] gap-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Time</span>
                  <span>{new Date(entry.createdAtIso).toLocaleString()}</span>
                  {entry.actorId && (
                    <>
                      <span className="font-medium text-slate-600">Actor</span>
                      <span className="font-mono">{entry.actorId}</span>
                    </>
                  )}
                  {entry.orgId && (
                    <>
                      <span className="font-medium text-slate-600">Org</span>
                      <span className="font-mono">{entry.orgId}</span>
                    </>
                  )}
                  <span className="font-medium text-slate-600">Trace</span>
                  <span className="font-mono">{entry.traceId}</span>
                </div>
                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                      Metadata
                    </summary>
                    <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-600">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {loading && <p className="text-sm text-slate-500">Loading audit log…</p>}
    </section>
  );
}
