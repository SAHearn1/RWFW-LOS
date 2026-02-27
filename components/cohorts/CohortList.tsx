"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
import CohortCard from "./CohortCard";

type DerivedCohort = {
  missionId: string;
  learnerCount: number;
};

export default function CohortList() {
  const [cohorts, setCohorts] = useState<DerivedCohort[] | null>(null);

  useEffect(() => {
    const records = localLedgerAdapter.readAll();
    const missionRecords = records.filter((r) => r.type === "mission");

    const byMission = new Map<string, Set<string>>();
    for (const r of missionRecords) {
      if (!byMission.has(r.missionId)) {
        byMission.set(r.missionId, new Set());
      }
      byMission.get(r.missionId)!.add(r.learnerId);
    }

    const derived: DerivedCohort[] = Array.from(byMission.entries()).map(
      ([missionId, learners]) => ({ missionId, learnerCount: learners.size })
    );

    setCohorts(derived);
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Cohorts</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Manage your learner cohorts, track enrollment, and monitor cohort-level progress.
      </p>

      {cohorts === null && (
        <p className="text-sm text-slate-500">Loading cohort data…</p>
      )}

      {cohorts !== null && cohorts.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-800">No cohorts assigned yet.</p>
          <p className="mt-1">Cohorts are created in the Builder.</p>
          <Link href="/app/builder" className="mt-3 inline-block text-xs text-slate-500 underline">
            Go to Builder →
          </Link>
        </div>
      )}

      {cohorts !== null && cohorts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {cohorts.map((c) => (
            <CohortCard
              key={c.missionId}
              name={c.missionId}
              learnerCount={c.learnerCount}
              status="active"
            />
          ))}
        </div>
      )}
    </section>
  );
}
