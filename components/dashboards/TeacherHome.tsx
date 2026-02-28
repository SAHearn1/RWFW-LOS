"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { phase1FeatureFlags } from "@/lib/config/featureFlags";
import type { VerificationEvent } from "@/lib/runtime/contracts/types";

type TeacherStats = {
  interventionCount: number;
  activeCohortCount: number;
  reviewBacklog: number;
};

export default function TeacherHome() {
  const [stats, setStats] = useState<TeacherStats | null>(null);

  useEffect(() => {
    if (!phase1FeatureFlags.enableLedger) {
      setStats({ interventionCount: 0, activeCohortCount: 0, reviewBacklog: 0 });
      return;
    }

    const records = localLedgerAdapter.readAll();
    const missions = records.filter((r) => r.type === "mission");
    const artifacts = records.filter((r) => r.type === "artifact");
    const verifications = records.filter((r) => r.type === "verification");

    const uniqueMissionIds = new Set(missions.map((r) => r.missionId));
    const artifactMissionIds = new Set(artifacts.map((r) => r.missionId));
    const verifiedMissionIds = new Set(verifications.map((r) => r.missionId));

    // Intervention queue: missions with no artifact and not yet verified
    const interventionCount = Array.from(uniqueMissionIds).filter(
      (id) => !artifactMissionIds.has(id) && !verifiedMissionIds.has(id)
    ).length;

    // Review backlog: verifications with partial or missing verdict
    const reviewBacklog = verifications.filter((v) => {
      const payload = v.payload as VerificationEvent;
      return payload.verdict === "partial" || payload.verdict === "missing";
    }).length;

    setStats({
      interventionCount,
      activeCohortCount: uniqueMissionIds.size,
      reviewBacklog,
    });
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Teacher)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Coordinate learner interventions, monitor review queues, and keep cohort progress moving.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="teacher-intervention-card">
          <h2 className="font-semibold text-slate-900">Intervention Queue</h2>
          {stats === null ? (
            <p className="mt-2 text-xs text-slate-400">Loading…</p>
          ) : (
            <>
              <p className="mt-1 text-3xl font-bold text-slate-800">{stats.interventionCount}</p>
              <p className="mt-1 text-xs text-slate-500">missions needing facilitator support</p>
            </>
          )}
          <Link href="/app/pickups" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Pickups →
          </Link>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="teacher-cohort-card">
          <h2 className="font-semibold text-slate-900">Cohort Flow</h2>
          {stats === null ? (
            <p className="mt-2 text-xs text-slate-400">Loading…</p>
          ) : (
            <>
              <p className="mt-1 text-3xl font-bold text-slate-800">{stats.activeCohortCount}</p>
              <p className="mt-1 text-xs text-slate-500">active missions tracked in ledger</p>
            </>
          )}
          <Link href="/app/cohorts" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Cohorts →
          </Link>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="teacher-reviews-card">
          <h2 className="font-semibold text-slate-900">Evidence Reviews</h2>
          {stats === null ? (
            <p className="mt-2 text-xs text-slate-400">Loading…</p>
          ) : (
            <>
              <p className="mt-1 text-3xl font-bold text-slate-800">{stats.reviewBacklog}</p>
              <p className="mt-1 text-xs text-slate-500">partial or missing verifications</p>
            </>
          )}
          <Link href="/app/reviews" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Reviews →
          </Link>
        </article>
      </div>

      {!phase1FeatureFlags.enableLedger && (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Live stats require the ledger feature. Set <code>NEXT_PUBLIC_ENABLE_LEDGER=true</code> to activate.
        </p>
      )}
    </section>
  );
}
