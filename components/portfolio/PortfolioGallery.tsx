"use client";

import { useEffect, useState } from "react";

import { localLedgerAdapter, type LedgerRecord } from "@/lib/ledger/adapter";
import { phase3FeatureFlags } from "@/lib/config/featureFlags";
import type { RuntimeArtifact, RuntimeMission } from "@/lib/runtime/contracts/types";
import { readRuntimeState } from "@/lib/runtime/engine/store";

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max) + "…";
}

export default function PortfolioGallery() {
  const [artifactRecords, setArtifactRecords] = useState<LedgerRecord[]>([]);
  const [missionCounts, setMissionCounts] = useState({
    started: 0,
    submitted: 0,
    verified: 0
  });

  useEffect(() => {
    // Load artifact records from ledger (localStorage)
    if (phase3FeatureFlags.enableLedger) {
      const all = localLedgerAdapter.readAll();
      setArtifactRecords(all.filter((record) => record.type === "artifact"));
    }

    // Load mission stage counts from runtime state
    const runtimeState = readRuntimeState();
    const missions = Object.values(runtimeState.missions) as RuntimeMission[];
    setMissionCounts({
      started: missions.filter((m) => m.stage === "in_progress").length,
      submitted: missions.filter((m) => m.stage === "submitted").length,
      verified: missions.filter((m) => m.stage === "verified").length
    });
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold" data-tour="page-title">
        Portfolio
      </h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Your artifact gallery and credential progress summary.
      </p>

      {/* Credential progress summary */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Credential Progress</h2>
        <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="grid grid-cols-[180px_1fr] gap-3">
            <dt className="font-medium text-slate-600">Missions In Progress</dt>
            <dd>{missionCounts.started}</dd>
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-3">
            <dt className="font-medium text-slate-600">Missions Submitted</dt>
            <dd>{missionCounts.submitted}</dd>
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-3">
            <dt className="font-medium text-slate-600">Missions Verified</dt>
            <dd>{missionCounts.verified}</dd>
          </div>
        </dl>
      </section>

      {/* Artifact gallery */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Artifact Gallery</h2>
        {!phase3FeatureFlags.enableLedger ? (
          <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Ledger is disabled. Enable{" "}
            <code className="font-mono">NEXT_PUBLIC_ENABLE_LEDGER</code> to view saved artifacts.
          </p>
        ) : artifactRecords.length === 0 ? (
          <div
            className="rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600"
            data-tour="portfolio-gallery"
          >
            Your portfolio is empty. Complete missions and save artifacts in Studio.
          </div>
        ) : (
          <ol className="space-y-3" data-tour="portfolio-gallery">
            {artifactRecords.map((record) => {
              const artifact = record.payload as RuntimeArtifact;
              return (
                <li
                  key={record.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">
                      Mission: {record.missionId}
                    </p>
                    <p className="text-sm text-slate-800">
                      {truncate(artifact.content ?? "", 120)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Saved {new Date(record.createdAtIso).toLocaleString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </section>
  );
}
