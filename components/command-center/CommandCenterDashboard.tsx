"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { localLedgerAdapter } from "@/lib/ledger/adapter";

type SummaryStats = {
  activeCohorts: number;
  reviewBacklog: number;
  pickupQueue: number;
};

export default function CommandCenterDashboard() {
  const [stats, setStats] = useState<SummaryStats>({ activeCohorts: 0, reviewBacklog: 0, pickupQueue: 0 });

  useEffect(() => {
    const records = localLedgerAdapter.readAll();

    const uniqueMissionIds = new Set(
      records.filter((r) => r.type === "mission").map((r) => r.missionId)
    );

    const artifactMissionIds = new Set(
      records.filter((r) => r.type === "artifact").map((r) => r.missionId)
    );
    const verifiedMissionIds = new Set(
      records.filter((r) => r.type === "verification").map((r) => r.missionId)
    );

    // Pickup queue: missions with no artifact and not yet verified
    const pickupQueue = Array.from(uniqueMissionIds).filter(
      (id) => !artifactMissionIds.has(id) && !verifiedMissionIds.has(id)
    ).length;

    const artifactCount = records.filter((r) => r.type === "artifact").length;

    setStats({
      activeCohorts: uniqueMissionIds.size,
      reviewBacklog: artifactCount,
      pickupQueue,
    });
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Command Center</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Your operational hub — active cohorts, pickup queue, and review backlog at a glance.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Active Cohorts</h2>
          <p className="mt-1 text-3xl font-bold text-slate-800">{stats.activeCohorts}</p>
          <p className="mt-1 text-slate-500 text-xs">missions tracked in ledger</p>
          <Link href="/app/cohorts" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Cohorts →
          </Link>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Pickup Queue</h2>
          <p className="mt-1 text-3xl font-bold text-slate-800">{stats.pickupQueue}</p>
          <p className="mt-1 text-slate-500 text-xs">missions needing facilitator pickup</p>
          <Link href="/app/pickups" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Pickups →
          </Link>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Review Backlog</h2>
          <p className="mt-1 text-3xl font-bold text-slate-800">{stats.reviewBacklog}</p>
          <p className="mt-1 text-slate-500 text-xs">artifact records pending review</p>
          <Link href="/app/reviews" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Reviews →
          </Link>
        </article>
      </div>
    </section>
  );
}
