"use client";

import { useEffect, useState } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { readRuntimeState } from "@/lib/runtime/engine/store";

export default function AdultLearnerHome() {
  const [activeMissions, setActiveMissions] = useState(0);
  const [artifactCount, setArtifactCount] = useState(0);
  const [verificationCount, setVerificationCount] = useState(0);

  useEffect(() => {
    const state = readRuntimeState();
    const missions = Object.values(state.missions);
    setActiveMissions(missions.filter((m) => m.stage === "in_progress").length);

    const records = localLedgerAdapter.readAll();
    setArtifactCount(records.filter((r) => r.type === "artifact").length);
    setVerificationCount(records.filter((r) => r.type === "verification").length);
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Adult Learner)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Focus your independent adult learning pathway with practical missions and portfolio-ready artifacts.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="mission-draft">
          <h2 className="font-semibold text-slate-900">Current Goal</h2>
          <p className="mt-1 text-slate-600">Define this week&apos;s applied objective and launch a mission cycle.</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{activeMissions}</p>
          <p className="text-xs text-slate-500">missions in progress</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="studio-entry">
          <h2 className="font-semibold text-slate-900">Artifact Studio</h2>
          <p className="mt-1 text-slate-600">Convert your mission output into a polished artifact with evidence notes.</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{artifactCount}</p>
          <p className="text-xs text-slate-500">artifacts saved</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="verification-summary">
          <h2 className="font-semibold text-slate-900">Progress Signals</h2>
          <p className="mt-1 text-slate-600">Track readiness and credential progress as your portfolio evolves.</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{verificationCount}</p>
          <p className="text-xs text-slate-500">verifications completed</p>
        </article>
      </div>
    </section>
  );
}
