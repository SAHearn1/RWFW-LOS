"use client";

import { useMemo } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { phase3FeatureFlags } from "@/lib/config/featureFlags";

export default function CredentialsSummary() {
  const records = useMemo(() => {
    if (!phase3FeatureFlags.enableLedger) {
      return [];
    }

    return localLedgerAdapter.readAll();
  }, []);

  const verificationCount = records.filter((record) => record.type === "verification").length;
  const artifactCount = records.filter((record) => record.type === "artifact").length;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Credentials</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Evidence and verification summary for the active learner workspace.
      </p>
      {!phase3FeatureFlags.enableLedger ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ledger is disabled. Enable `NEXT_PUBLIC_ENABLE_LEDGER` to view credential evidence.
        </p>
      ) : null}
      <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="grid grid-cols-[180px_1fr] gap-3">
          <dt className="font-medium text-slate-600">Artifacts Saved</dt>
          <dd>{artifactCount}</dd>
        </div>
        <div className="grid grid-cols-[180px_1fr] gap-3">
          <dt className="font-medium text-slate-600">Verifications Recorded</dt>
          <dd>{verificationCount}</dd>
        </div>
      </dl>
    </section>
  );
}
