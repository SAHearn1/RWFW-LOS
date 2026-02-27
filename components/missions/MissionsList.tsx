"use client";

import { useState } from "react";
import Link from "next/link";

import type { RuntimeMission, RuntimeMissionStage, VerificationEvent } from "@/lib/runtime/contracts/types";
import { dispatchRuntimeEvent, readRuntimeState } from "@/lib/runtime/engine/store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MissionRow = {
  mission: RuntimeMission;
  artifactCount: number;
  verifications: VerificationEvent[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STAGE_BADGE: Record<RuntimeMissionStage, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  submitted: { label: "Submitted", className: "bg-amber-100 text-amber-700" },
  verified: { label: "Verified", className: "bg-green-100 text-green-700" },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StageBadge({ stage }: { stage: RuntimeMissionStage }) {
  const { label, className } = STAGE_BADGE[stage] ?? STAGE_BADGE.not_started;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function MissionCard({
  mission,
  artifactCount,
  verifications,
  onAdvance,
}: MissionRow & { onAdvance: (missionId: string, stage: RuntimeMissionStage) => void }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" data-tour="mission-actions">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900 leading-snug">{mission.title}</h2>
        <StageBadge stage={mission.stage} />
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
        <div className="flex gap-1">
          <dt className="font-medium text-slate-500">Artifacts:</dt>
          <dd>{artifactCount} artifact{artifactCount !== 1 ? "s" : ""}</dd>
        </div>
        {verifications.length > 0 && (
          <div className="flex gap-1">
            <dt className="font-medium text-slate-500">Verifications:</dt>
            <dd>{verifications.length}</dd>
          </div>
        )}
        <div className="flex gap-1">
          <dt className="font-medium text-slate-500">Updated:</dt>
          <dd>{formatDate(mission.updatedAtIso)}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {mission.stage === "not_started" && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
            onClick={() => onAdvance(mission.id, "in_progress")}
          >
            Start Mission
          </button>
        )}

        {mission.stage === "in_progress" && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 transition-colors"
            onClick={() => onAdvance(mission.id, "submitted")}
          >
            Submit for Review
          </button>
        )}

        {mission.stage !== "verified" && (
          <Link
            href="/app/studio"
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
            data-tour="studio-entry"
          >
            Open Studio &rarr;
          </Link>
        )}

        {mission.stage === "verified" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
            ✓ Verified
          </span>
        )}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-3xl" aria-hidden="true">
        🗺️
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-800">No missions started yet.</p>
        <p className="text-sm text-slate-500">
          Begin a mission from your home page, then return here to track progress.
        </p>
      </div>
      <Link
        href="/app"
        className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
      >
        Go to Home &rarr;
      </Link>
    </div>
  );
}

function RuntimeDisabledBanner() {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      <span aria-hidden="true">⚠️</span>
      <span>
        Mission tracking requires{" "}
        <code className="rounded bg-amber-100 px-1 font-mono text-xs">NEXT_PUBLIC_ENABLE_RUNTIME=true</code>{" "}
        to be set in your environment.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MissionsList() {
  const runtimeEnabled = Boolean(process.env.NEXT_PUBLIC_ENABLE_RUNTIME);

  const [rows, setRows] = useState<MissionRow[]>(() => {
    const state = readRuntimeState();
    return Object.values(state.missions).map((mission) => ({
      mission,
      artifactCount: Object.values(state.artifacts).filter((a) => a.missionId === mission.id).length,
      verifications: Object.values(state.verifications).filter((v) => v.missionId === mission.id),
    }));
  });

  const hasMissions = rows.length > 0;

  function handleAdvance(missionId: string, stage: RuntimeMissionStage) {
    const updatedAtIso = new Date().toISOString();
    dispatchRuntimeEvent({ type: "MISSION_ADVANCED", missionId, stage, updatedAtIso });
    setRows((prev) =>
      prev.map((row) =>
        row.mission.id === missionId
          ? { ...row, mission: { ...row.mission, stage, updatedAtIso } }
          : row
      )
    );
  }

  return (
    <section className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900" data-tour="page-title">
            Missions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track active missions, launch new learning cycles, and submit completed work for review.
          </p>
        </div>

        {hasMissions && (
          <Link
            href="/app"
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            data-tour="mission-draft"
          >
            + Start New Mission
          </Link>
        )}
      </div>

      {/* Feature-flag warning (always show the content below regardless) */}
      {!runtimeEnabled && <RuntimeDisabledBanner />}

      {/* Mission cards or empty state */}
      {hasMissions ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ mission, artifactCount, verifications }) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              artifactCount={artifactCount}
              verifications={verifications}
              onAdvance={handleAdvance}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
