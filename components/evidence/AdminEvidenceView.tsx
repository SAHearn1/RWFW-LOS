"use client";

import { useEffect, useState } from "react";

import { localLedgerAdapter, type LedgerRecord } from "@/lib/ledger/adapter";
import { shouldUseDbLedger } from "@/lib/ledger/dbAdapter";
import { phase3FeatureFlags } from "@/lib/config/featureFlags";

async function loadDbLedgerRecords(): Promise<LedgerRecord[]> {
  const response = await fetch("/api/ledger/records", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`ledger_records_failed_${response.status}`);
  }

  const payload = (await response.json()) as { records?: LedgerRecord[] };
  return payload.records ?? [];
}

export default function AdminEvidenceView() {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRecords = async () => {
      try {
        if (!phase3FeatureFlags.enableLedger) {
          if (active) {
            setRecords([]);
          }
          return;
        }

        if (!shouldUseDbLedger()) {
          if (active) {
            setRecords(localLedgerAdapter.readAll());
          }
          return;
        }

        const next = await loadDbLedgerRecords();
        if (active) {
          setRecords(next);
        }
      } catch (error) {
        if (active) {
          setRecordsError(error instanceof Error ? error.message : "ledger_records_failed");
        }
      }
    };

    void loadRecords();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Evidence</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Administrative readout of ledger evidence records.
      </p>
      {!phase3FeatureFlags.enableLedger ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ledger is disabled. Enable `NEXT_PUBLIC_ENABLE_LEDGER` to inspect evidence records.
        </p>
      ) : null}
      {recordsError ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ledger records unavailable ({recordsError}).
        </p>
      ) : null}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {records.length === 0 ? (
          <p>No evidence records available.</p>
        ) : (
          <ul className="space-y-2">
            {records.map((record) => (
              <li key={record.id} className="rounded border border-slate-200 bg-white p-2">
                <p className="font-medium">{record.type.toUpperCase()} - {record.id}</p>
                <p className="text-xs text-slate-500">Mission: {record.missionId} | Learner: {record.learnerId}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
