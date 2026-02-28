"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";

type LearnerStats = {
  activeMissions: number;
  artifactCount: number;
  verificationCount: number;
  passCount: number;
};

function computeStats(): LearnerStats {
  const records = localLedgerAdapter.readAll();

  const missions = records.filter((r) => r.type === "mission");
  const artifacts = records.filter((r) => r.type === "artifact");
  const verifications = records.filter((r) => r.type === "verification");

  const verifiedMissionIds = new Set(verifications.map((v) => v.missionId));
  const activeMissions = missions.filter((m) => !verifiedMissionIds.has(m.missionId)).length;

  const passCount = verifications.filter((r) => {
    const v = r.payload as { verdict?: string };
    return v.verdict === "pass";
  }).length;

  return {
    activeMissions,
    artifactCount: artifacts.length,
    verificationCount: verifications.length,
    passCount,
  };
}

export default function AdultLearnerHome() {
  const [stats, setStats] = useState<LearnerStats | null>(null);

  useEffect(() => {
    setStats(computeStats());
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Adult Learner)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Focus your independent adult learning pathway with practical missions and portfolio-ready artifacts.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article
          className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm"
          data-tour="mission-draft"
        >
          <h2 className="font-semibold text-slate-900">Current Goal</h2>
          {stats === null ? (
            <p className="mt-2 text-slate-400 text-xs">Loading…</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-slate-800">{stats.activeMissions}</p>
              <p className="mt-1 text-xs text-slate-500">
                active mission{stats.activeMissions !== 1 ? "s" : ""} in progress
              </p>
            </>
          )}
          <Link href="/app/missions" className="mt-3 inline-block text-xs text-slate-500 underline">
            View missions →
          </Link>
        </article>

        <article
          className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm"
          data-tour="studio-entry"
        >
          <h2 className="font-semibold text-slate-900">Artifact Studio</h2>
          {stats === null ? (
            <p className="mt-2 text-slate-400 text-xs">Loading…</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-slate-800">{stats.artifactCount}</p>
              <p className="mt-1 text-xs text-slate-500">
                artifact{stats.artifactCount !== 1 ? "s" : ""} created
              </p>
            </>
          )}
          <Link href="/app/studio" className="mt-3 inline-block text-xs text-slate-500 underline">
            Open studio →
          </Link>
        </article>

        <article
          className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm"
          data-tour="verification-summary"
        >
          <h2 className="font-semibold text-slate-900">Progress Signals</h2>
          {stats === null ? (
            <p className="mt-2 text-slate-400 text-xs">Loading…</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-slate-800">{stats.passCount}</p>
              <p className="mt-1 text-xs text-slate-500">
                verified pass{stats.passCount !== 1 ? "es" : ""} · {stats.verificationCount} total check{stats.verificationCount !== 1 ? "s" : ""}
              </p>
            </>
          )}
          <Link href="/app/credentials" className="mt-3 inline-block text-xs text-slate-500 underline">
            View credentials →
          </Link>
        </article>
      </div>
    </section>
  );
}
