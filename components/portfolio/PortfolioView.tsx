"use client";

import { useEffect, useState } from "react";

import { localLedgerAdapter, type LedgerRecord } from "@/lib/ledger/adapter";
import { isDbLedgerFlagEnabled } from "@/lib/ledger/flags";
import { phase1FeatureFlags } from "@/lib/config/featureFlags";
import type { RuntimeArtifact, VerificationEvent } from "@/lib/runtime/contracts/types";

async function loadDbLedgerRecords(): Promise<LedgerRecord[]> {
  const response = await fetch("/api/ledger/records", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`ledger_records_failed_${response.status}`);
  }

  const payload = (await response.json()) as { records?: LedgerRecord[] };
  return payload.records ?? [];
}

export default function PortfolioView() {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        let loaded: LedgerRecord[];
        if (isDbLedgerFlagEnabled()) {
          loaded = await loadDbLedgerRecords();
        } else {
          loaded = localLedgerAdapter.readAll();
        }
        if (active) {
          setRecords(loaded);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "portfolio_load_failed");
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

  const artifacts = records.filter((r) => r.type === "artifact");
  const verifications = records.filter((r) => r.type === "verification");

  const verdictCounts = verifications.reduce(
    (acc, v) => {
      const payload = v.payload as VerificationEvent;
      if (payload.verdict === "pass") acc.pass++;
      else if (payload.verdict === "partial") acc.partial++;
      else acc.missing++;
      return acc;
    },
    { pass: 0, partial: 0, missing: 0 }
  );

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Portfolio</h1>
      <p className="text-sm text-slate-700">
        Your evidence portfolio — saved artifacts, verification results, and credential progress.
      </p>

      {!phase1FeatureFlags.enableLedger && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Portfolio evidence requires the ledger feature. Contact your administrator.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Unable to load portfolio data ({error}).
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Loading portfolio…</p>
      )}

      {!loading && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <h2 className="font-semibold text-slate-900">Submitted Artifacts</h2>
              <p className="mt-1 text-3xl font-bold text-slate-800">{artifacts.length}</p>
              <p className="mt-1 text-xs text-slate-500">artifacts saved in Studio</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <h2 className="font-semibold text-slate-900">Verification Results</h2>
              <p className="mt-1 text-3xl font-bold text-slate-800">{verifications.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                {verdictCounts.pass} pass · {verdictCounts.partial} partial · {verdictCounts.missing} missing
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <h2 className="font-semibold text-slate-900">Credential Progress</h2>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {verifications.length > 0
                  ? `${Math.round((verdictCounts.pass / verifications.length) * 100)}%`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                verified pass rate across {verifications.length} checks
              </p>
            </article>
          </div>

          {artifacts.length === 0 && (
            <p className="text-sm text-slate-500">No artifacts yet. Save work in Studio to build your portfolio.</p>
          )}

          {artifacts.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Artifact Gallery</h2>
              <ol className="space-y-2" data-tour="artifact-gallery">
                {artifacts.slice(0, 20).map((record) => {
                  const artifact = record.payload as RuntimeArtifact;
                  const linked = verifications.filter(
                    (v) => (v.payload as VerificationEvent).artifactId === artifact.id
                  );
                  const verdict = linked.length > 0 ? (linked[0].payload as VerificationEvent).verdict : null;
                  return (
                    <li
                      key={record.id}
                      className="rounded-lg border border-slate-200 bg-white p-4 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs text-slate-400">{artifact.id}</p>
                          <p className="mt-1 line-clamp-2 text-slate-700">{artifact.content || "(empty artifact)"}</p>
                        </div>
                        {verdict && (
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                              verdict === "pass"
                                ? "bg-green-100 text-green-800"
                                : verdict === "partial"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {verdict}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(record.updatedAtIso).toLocaleString()} · mission: {record.missionId}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </>
      )}
    </section>
  );
}
