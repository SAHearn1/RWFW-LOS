"use client";

import { useState } from "react";

import { deleteLedgerRecordsByLearner, purgeLedgerRecordsBefore } from "@/lib/ledger/adapter";
import { deleteRuntimeStateByLearner, purgeRuntimeStateBefore } from "@/lib/runtime/engine/store";

export default function DataRetentionPanel() {
  const [status, setStatus] = useState<string>("idle");

  const purgeThirtyDays = () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const purgedLedger = purgeLedgerRecordsBefore(cutoff);
    purgeRuntimeStateBefore(cutoff);
    setStatus(`purged_before_${cutoff}_ledger_${purgedLedger}`);
  };

  const deleteLearner = () => {
    const learnerId = "learner.local";
    const removedLedger = deleteLedgerRecordsByLearner(learnerId);
    deleteRuntimeStateByLearner(learnerId);
    setStatus(`deleted_learner_${learnerId}_ledger_${removedLedger}`);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4" data-tour="retention-controls">
      <h2 className="text-lg font-semibold text-slate-900">Retention Controls</h2>
      <p className="mt-1 text-sm text-slate-600">
        Local operational controls for data-retention and deletion hooks.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          onClick={purgeThirtyDays}
        >
          Purge Older Than 30 Days
        </button>
        <button
          type="button"
          className="rounded border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
          onClick={deleteLearner}
        >
          Delete Learner Local Data
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Last operation: {status}</p>
    </section>
  );
}
