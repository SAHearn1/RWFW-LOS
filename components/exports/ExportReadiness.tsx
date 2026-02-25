"use client";

import { useMemo } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { createPilotSnapshotFromLocalState } from "@/lib/observability/pilotKpiSnapshot";
import type { PilotMetricKey } from "@/lib/observability/pilotKpiContracts";
import { readRuntimeState } from "@/lib/runtime/engine/store";

const KPI_LABELS: Record<PilotMetricKey, string> = {
  landing_to_signup_completion_rate: "Landing to Signup",
  first_mission_start_rate: "First Mission Start",
  artifact_save_rate: "Artifact Save Rate",
  verification_pass_rate: "Verification Pass Rate",
  teacher_intervention_backlog: "Teacher Intervention Backlog",
  admin_export_readiness_rate: "Admin Export Readiness"
};

export default function ExportReadiness() {
  const summary = useMemo(() => {
    const records = localLedgerAdapter.readAll();
    const runtime = readRuntimeState();

    return {
      missionCount: Object.keys(runtime.missions).length,
      artifactCount: records.filter((record) => record.type === "artifact").length,
      verificationCount: records.filter((record) => record.type === "verification").length,
      pilotSnapshot: createPilotSnapshotFromLocalState(runtime, records)
    };
  }, []);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold" data-tour="page-title">Exports Readiness</h1>
        <p className="text-sm text-slate-700" data-tour="page-description">
          Operational placeholder for export readiness prior to full pipeline rollout.
        </p>
      </div>

      <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Runtime Missions</dt><dd>{summary.missionCount}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Ledger Artifacts</dt><dd>{summary.artifactCount}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Ledger Verifications</dt><dd>{summary.verificationCount}</dd></div>
      </dl>

      <section className="space-y-3" data-tour="admin-pilot-health">
        <h2 className="text-lg font-semibold text-slate-900">Pilot Health</h2>
        <p className="text-sm text-slate-600">Admin KPI snapshot derived from current runtime and ledger state.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.pilotSnapshot.items.map((item) => (
            <article key={item.metricKey} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{KPI_LABELS[item.metricKey]}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}%</p>
              <p className="mt-1 text-xs text-slate-500">Samples: {item.sampleSize}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
