"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { phase1FeatureFlags } from "@/lib/config/featureFlags";
import { DEFAULT_STANDARDS } from "@/lib/standards/verifier/localVerifier";
import type { VerificationEvent } from "@/lib/runtime/contracts/types";

type AdminStats = {
  totalStandards: number;
  coveredStandards: number;
  evidenceRecords: number;
  passRate: number;
};

export default function AdminHome() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    const totalStandards = DEFAULT_STANDARDS.length;

    if (!phase1FeatureFlags.enableLedger) {
      setStats({ totalStandards, coveredStandards: 0, evidenceRecords: 0, passRate: 0 });
      return;
    }

    const records = localLedgerAdapter.readAll();
    const verifications = records.filter((r) => r.type === "verification");

    const coveredIds = new Set<string>();
    let passCount = 0;

    for (const v of verifications) {
      const payload = v.payload as VerificationEvent;
      for (const std of payload.standards) {
        coveredIds.add(std);
      }
      if (payload.verdict === "pass") passCount++;
    }

    const passRate =
      verifications.length > 0 ? Math.round((passCount / verifications.length) * 100) : 0;

    setStats({
      totalStandards,
      coveredStandards: coveredIds.size,
      evidenceRecords: verifications.length,
      passRate,
    });
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
          {stats === null ? (
            <p className="mt-2 text-xs text-slate-400">Loading…</p>
          ) : (
            <>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {stats.coveredStandards}/{stats.totalStandards}
              </p>
              <p className="mt-1 text-xs text-slate-500">standards covered by evidence</p>
            </>
          )}
          <Link href="/app/standards" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Standards →
          </Link>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="admin-evidence-card">
          <h2 className="font-semibold text-slate-900">Evidence Readiness</h2>
          {stats === null ? (
            <p className="mt-2 text-xs text-slate-400">Loading…</p>
          ) : (
            <>
              <p className="mt-1 text-3xl font-bold text-slate-800">{stats.passRate}%</p>
              <p className="mt-1 text-xs text-slate-500">
                pass rate across {stats.evidenceRecords} verification records
              </p>
            </>
          )}
          <Link href="/app/evidence" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Evidence →
          </Link>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="admin-exports-card">
          <h2 className="font-semibold text-slate-900">Export Operations</h2>
          <p className="mt-1 text-xs text-slate-600">
            Validate release and reporting readiness before stakeholder export.
          </p>
          <Link href="/app/exports" className="mt-2 inline-block text-xs text-slate-500 underline">
            Go to Exports →
          </Link>
        </article>
      </div>

      {!phase1FeatureFlags.enableLedger && (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Live evidence stats require the ledger feature. Set <code>NEXT_PUBLIC_ENABLE_LEDGER=true</code> to activate.
        </p>
      )}
    </section>
  );
}
