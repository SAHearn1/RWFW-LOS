"use client";

import { useMemo } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { readRuntimeState } from "@/lib/runtime/engine/store";

export default function ExportReadiness() {
  const summary = useMemo(() => {
    const records = localLedgerAdapter.readAll();
    const runtime = readRuntimeState();

    return {
      missionCount: Object.keys(runtime.missions).length,
      artifactCount: records.filter((record) => record.type === "artifact").length,
      verificationCount: records.filter((record) => record.type === "verification").length
    };
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Exports Readiness</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">Operational placeholder for export readiness prior to full pipeline rollout.</p>
      <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Runtime Missions</dt><dd>{summary.missionCount}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Ledger Artifacts</dt><dd>{summary.artifactCount}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Ledger Verifications</dt><dd>{summary.verificationCount}</dd></div>
      </dl>
    </section>
  );
}
