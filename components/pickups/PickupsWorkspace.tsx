"use client";

import { useMemo } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { phase1FeatureFlags } from "@/lib/config/featureFlags";

export default function PickupsWorkspace() {
  if (!phase1FeatureFlags.enablePickup) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold" data-tour="page-title">Pickups</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Pickups feature is not currently enabled.</p>
          <p className="mt-1">Set <code>NEXT_PUBLIC_ENABLE_PICKUP=true</code> to activate this feature.</p>
        </div>
      </section>
    );
  }

  return <PickupsEnabled />;
}

function PickupsEnabled() {
  const queues = useMemo(() => {
    const records = localLedgerAdapter.readAll();
    const missions = records.filter((r) => r.type === "mission");
    const artifacts = records.filter((r) => r.type === "artifact");
    const verifications = records.filter((r) => r.type === "verification");

    const artifactMissionIds = new Set(artifacts.map((r) => r.missionId));
    const verificationMissionIds = new Set(verifications.map((r) => r.missionId));

    const pending: string[] = [];
    const inProgress: string[] = [];
    const completed: string[] = [];

    for (const mission of missions) {
      const mid = mission.missionId;
      if (verificationMissionIds.has(mid)) {
        completed.push(mid);
      } else if (artifactMissionIds.has(mid)) {
        inProgress.push(mid);
      } else {
        pending.push(mid);
      }
    }

    return { pending, inProgress, completed };
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Pickups</h1>
      <p className="text-sm text-slate-700">Manage pickup assignments for learners in your cohorts.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Pending Pickups</h2>
          <p className="mt-1 text-2xl font-bold text-slate-800">{queues.pending.length}</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {queues.pending.map((id) => (
              <li key={id} className="truncate font-mono">{id}</li>
            ))}
            {queues.pending.length === 0 && (
              <li className="text-slate-400">No pending missions.</li>
            )}
          </ul>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">In Progress</h2>
          <p className="mt-1 text-2xl font-bold text-slate-800">{queues.inProgress.length}</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {queues.inProgress.map((id) => (
              <li key={id} className="truncate font-mono">{id}</li>
            ))}
            {queues.inProgress.length === 0 && (
              <li className="text-slate-400">No missions in progress.</li>
            )}
          </ul>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Completed</h2>
          <p className="mt-1 text-2xl font-bold text-slate-800">{queues.completed.length}</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {queues.completed.map((id) => (
              <li key={id} className="truncate font-mono">{id}</li>
            ))}
            {queues.completed.length === 0 && (
              <li className="text-slate-400">No completed missions.</li>
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
