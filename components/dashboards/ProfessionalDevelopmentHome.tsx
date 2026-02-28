"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";

type PDStats = {
  sessionPipeline: number;
  reviewBacklog: number;
  cohortCount: number;
  passRate: number;
};

function computeStats(): PDStats {
  const records = localLedgerAdapter.readAll();

  const missions = records.filter((r) => r.type === "mission");
  const artifacts = records.filter((r) => r.type === "artifact");
  const verifications = records.filter((r) => r.type === "verification");

  const artifactMissionIds = new Set(artifacts.map((a) => a.missionId));
  const verifiedMissionIds = new Set(verifications.map((v) => v.missionId));

  // Sessions in pipeline: missions that have been started but not yet verified
  const sessionPipeline = missions.filter(
    (m) => artifactMissionIds.has(m.missionId) && !verifiedMissionIds.has(m.missionId)
  ).length;

  // Review backlog: verifications with partial or missing verdict
  const reviewBacklog = verifications.filter((r) => {
    const v = r.payload as { verdict?: string };
    return v.verdict === "partial" || v.verdict === "missing";
  }).length;

  // Unique cohort IDs (unique missionIds from mission records)
  const cohortCount = new Set(missions.map((m) => m.missionId)).size;

  // Pass rate: verifications with "pass" verdict / total verifications
  const totalVerifs = verifications.length;
  const passCount = verifications.filter((r) => {
    const v = r.payload as { verdict?: string };
    return v.verdict === "pass";
  }).length;
  const passRate = totalVerifs > 0 ? Math.round((passCount / totalVerifs) * 100) : 0;

  return { sessionPipeline, reviewBacklog, cohortCount, passRate };
}

export default function ProfessionalDevelopmentHome() {
  const [stats, setStats] = useState<PDStats | null>(null);

  useEffect(() => {
    setStats(computeStats());
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Professional Development)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Coordinate professional learning, review evidence, and move cohorts through targeted growth cycles.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <h2 className="font-semibold text-slate-900">Session Pipeline</h2>
          {stats === null ? (
            <p className="mt-2 text-slate-400 text-xs">Loading…</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-slate-800">{stats.sessionPipeline}</p>
              <p className="mt-1 text-xs text-slate-500">
                mission{stats.sessionPipeline !== 1 ? "s" : ""} with artifacts awaiting verification
              </p>
            </>
          )}
          <Link href="/app/reviews" className="mt-3 inline-block text-xs text-slate-500 underline">
            Review queue →
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <h2 className="font-semibold text-slate-900">Facilitator Reviews</h2>
          {stats === null ? (
            <p className="mt-2 text-slate-400 text-xs">Loading…</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-slate-800">{stats.reviewBacklog}</p>
              <p className="mt-1 text-xs text-slate-500">
                partial or missing outcome{stats.reviewBacklog !== 1 ? "s" : ""} needing follow-up
              </p>
            </>
          )}
          <Link href="/app/pickups" className="mt-3 inline-block text-xs text-slate-500 underline">
            Pickup queue →
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <h2 className="font-semibold text-slate-900">Cohort Health</h2>
          {stats === null ? (
            <p className="mt-2 text-slate-400 text-xs">Loading…</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-slate-800">{stats.cohortCount}</p>
              <p className="mt-1 text-xs text-slate-500">
                active cohort{stats.cohortCount !== 1 ? "s" : ""} · {stats.passRate}% pass rate
              </p>
            </>
          )}
          <Link href="/app/cohorts" className="mt-3 inline-block text-xs text-slate-500 underline">
            Manage cohorts →
          </Link>
        </article>
      </div>
    </section>
  );
}
