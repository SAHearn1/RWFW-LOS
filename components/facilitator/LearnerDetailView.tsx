"use client";

import { useEffect, useState } from "react";

import type { LedgerRecord } from "@/lib/ledger/adapter";
import type { RuntimeArtifact, RuntimeMission, VerificationEvent } from "@/lib/runtime/contracts/types";

type LearnerDetailProps = {
  learnerId: string;
};

const VERDICT_BADGE: Record<string, string> = {
  pass: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  missing: "bg-red-100 text-red-800",
};

export default function LearnerDetailView({ learnerId }: LearnerDetailProps) {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const url = `/api/ledger/records?learnerId=${encodeURIComponent(learnerId)}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `ledger_fetch_failed_${response.status}`);
        }
        const payload = (await response.json()) as { records: LedgerRecord[] };
        if (active) {
          setRecords(payload.records ?? []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "ledger_fetch_failed");
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
  }, [learnerId]);

  const missions = records.filter((r) => r.type === "mission");
  const artifacts = records.filter((r) => r.type === "artifact");
  const verifications = records.filter((r) => r.type === "verification");

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-tour="page-title">Learner Detail</h1>
        <p className="mt-1 font-mono text-xs text-slate-500">{learnerId}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Unable to load learner data ({error}).
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">Loading learner records…</p>}

      {!loading && !error && (
        <>
          {/* Summary stats */}
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <h2 className="font-semibold text-slate-900">Missions</h2>
              <p className="mt-1 text-3xl font-bold text-slate-800">{missions.length}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <h2 className="font-semibold text-slate-900">Artifacts</h2>
              <p className="mt-1 text-3xl font-bold text-slate-800">{artifacts.length}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <h2 className="font-semibold text-slate-900">Verifications</h2>
              <p className="mt-1 text-3xl font-bold text-slate-800">{verifications.length}</p>
            </article>
          </div>

          {records.length === 0 && (
            <p className="text-sm text-slate-500">No ledger records found for this learner.</p>
          )}

          {/* Mission list */}
          {missions.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Missions</h2>
              <ol className="space-y-2">
                {missions.map((r) => {
                  const m = r.payload as RuntimeMission;
                  const missionArtifacts = artifacts.filter((a) => a.missionId === r.missionId);
                  const missionVerifs = verifications.filter((v) => v.missionId === r.missionId);
                  return (
                    <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{m.title || r.missionId}</p>
                          {m.stage && (
                            <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {m.stage}
                            </span>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p>{missionArtifacts.length} artifact{missionArtifacts.length !== 1 ? "s" : ""}</p>
                          <p>{missionVerifs.length} verification{missionVerifs.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Updated {new Date(r.updatedAtIso).toLocaleString()}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* Verification outcomes */}
          {verifications.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Verification Outcomes</h2>
              <ol className="space-y-2">
                {verifications.map((r) => {
                  const v = r.payload as VerificationEvent;
                  return (
                    <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${VERDICT_BADGE[v.verdict] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {v.verdict}
                        </span>
                        <span className="text-xs text-slate-500">
                          {v.standards.join(", ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(r.createdAtIso).toLocaleString()} · mission: {r.missionId}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* Latest artifacts */}
          {artifacts.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Artifacts</h2>
              <ol className="space-y-2">
                {artifacts.slice(0, 10).map((r) => {
                  const a = r.payload as RuntimeArtifact;
                  return (
                    <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                      <p className="line-clamp-2 text-slate-700">{a.content || "(empty)"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(r.updatedAtIso).toLocaleString()} · mission: {r.missionId}
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
