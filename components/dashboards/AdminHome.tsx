"use client";

import { useEffect, useState } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { readConfiguredStandards } from "@/lib/standards/configStore";

export default function AdminHome() {
  const [standardsCount, setStandardsCount] = useState(0);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [artifactCount, setArtifactCount] = useState(0);

  useEffect(() => {
    setStandardsCount(readConfiguredStandards().length);

    const records = localLedgerAdapter.readAll();
    setEvidenceCount(records.length);
    setArtifactCount(records.filter((r) => r.type === "artifact").length);
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Admin)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Monitor standards alignment, evidence readiness, and export posture with operational clarity.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="admin-standards-card">
          <h2 className="font-semibold text-slate-900">Standards Health</h2>
          <p className="mt-1 text-slate-600">Review standards coverage and identify missing verification areas.</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{standardsCount}</p>
          <p className="text-xs text-slate-500">configured standards</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="admin-evidence-card">
          <h2 className="font-semibold text-slate-900">Evidence Readiness</h2>
          <p className="mt-1 text-slate-600">Track evidence volume and consistency across learner pathways.</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{artifactCount}</p>
          <p className="text-xs text-slate-500">artifacts in ledger ({evidenceCount} total records)</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="admin-exports-card">
          <h2 className="font-semibold text-slate-900">Export Operations</h2>
          <p className="mt-1 text-slate-600">Validate release and reporting readiness before stakeholder export.</p>
        </article>
      </div>
    </section>
  );
}
