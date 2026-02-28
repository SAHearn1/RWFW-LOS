"use client";

import { useEffect, useMemo, useState } from "react";

import { phase3FeatureFlags } from "@/lib/config/featureFlags";
import { localLedgerAdapter, type LedgerRecord } from "@/lib/ledger/adapter";
import { isDbLedgerFlagEnabled } from "@/lib/ledger/flags";

type RecordType = "all" | "mission" | "artifact" | "verification";
type SortOrder = "newest" | "oldest";

const TYPE_BADGE: Record<string, string> = {
  mission: "bg-blue-100 text-blue-800",
  artifact: "bg-teal-100 text-teal-800",
  verification: "bg-purple-100 text-purple-800",
};

const VERDICT_BADGE: Record<string, string> = {
  pass: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  missing: "bg-red-100 text-red-800",
};

async function loadDbLedgerRecords(): Promise<LedgerRecord[]> {
  const response = await fetch("/api/ledger/records", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`ledger_records_failed_${response.status}`);
  }

  const payload = (await response.json()) as { records?: LedgerRecord[] };
  return payload.records ?? [];
}

export default function AdminEvidenceView() {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<RecordType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRecords = async () => {
      try {
        if (!phase3FeatureFlags.enableLedger) {
          if (active) {
            setRecords([]);
            setLoading(false);
          }
          return;
        }

        if (!isDbLedgerFlagEnabled()) {
          if (active) {
            setRecords(localLedgerAdapter.readAll());
            setLoading(false);
          }
          return;
        }

        const next = await loadDbLedgerRecords();
        if (active) {
          setRecords(next);
          setLoading(false);
        }
      } catch (error) {
        if (active) {
          setRecordsError(error instanceof Error ? error.message : "ledger_records_failed");
          setLoading(false);
        }
      }
    };

    void loadRecords();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = records;

    if (typeFilter !== "all") {
      result = result.filter((r) => r.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.missionId.toLowerCase().includes(q) ||
          r.learnerId.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      const ta = new Date(a.updatedAtIso).getTime();
      const tb = new Date(b.updatedAtIso).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

    return result;
  }, [records, typeFilter, searchQuery, sortOrder]);

  const counts = useMemo(
    () => ({
      all: records.length,
      mission: records.filter((r) => r.type === "mission").length,
      artifact: records.filter((r) => r.type === "artifact").length,
      verification: records.filter((r) => r.type === "verification").length,
    }),
    [records]
  );

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Evidence</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Administrative readout of ledger evidence records.
      </p>

      {!phase3FeatureFlags.enableLedger ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ledger is disabled. Enable <code>NEXT_PUBLIC_ENABLE_LEDGER</code> to inspect evidence records.
        </p>
      ) : null}

      {recordsError ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ledger records unavailable ({recordsError}).
        </p>
      ) : null}

      {/* Filter / search bar */}
      {phase3FeatureFlags.enableLedger && !recordsError && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Type filter tabs */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
            {(["all", "mission", "artifact", "verification"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`rounded px-3 py-1 capitalize transition-colors ${
                  typeFilter === t
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t} ({counts[t]})
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="search"
            placeholder="Search by ID, mission, or learner…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} / {records.length} record{records.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Record list */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading evidence records…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          {records.length === 0 ? "No evidence records available." : "No records match your filter."}
        </div>
      ) : (
        <ol className="space-y-2">
          {filtered.map((record) => {
            const isExpanded = expandedId === record.id;
            const payload = record.payload as Record<string, unknown>;
            const verdict =
              record.type === "verification"
                ? (payload.verdict as string | undefined)
                : undefined;

            return (
              <li key={record.id} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  className="w-full rounded-lg p-4 text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${
                        TYPE_BADGE[record.type] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {record.type}
                    </span>
                    {verdict && (
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          VERDICT_BADGE[verdict] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {verdict}
                      </span>
                    )}
                    <span className="font-mono text-xs text-slate-700 truncate max-w-[280px]">
                      {record.id}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      {new Date(record.updatedAtIso).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-slate-500">
                    <span>Mission: <span className="font-mono">{record.missionId}</span></span>
                    <span>Learner: <span className="font-mono">{record.learnerId}</span></span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                    <p className="mb-1 text-xs font-medium text-slate-600">Payload</p>
                    <pre className="overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap break-words">
                      {JSON.stringify(payload, null, 2)}
                    </pre>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
