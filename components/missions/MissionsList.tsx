"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { RuntimeMission, RuntimeMissionStage } from "@/lib/runtime/contracts/types";
import { readRuntimeState } from "@/lib/runtime/engine/store";

const STAGE_BADGE: Record<RuntimeMissionStage, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  submitted: { label: "Submitted", className: "bg-amber-100 text-amber-700" },
  verified: { label: "Verified", className: "bg-green-100 text-green-700" }
};

export default function MissionsList() {
  const [missions, setMissions] = useState<RuntimeMission[]>([]);

  useEffect(() => {
    const state = readRuntimeState();
    const list = Object.values(state.missions).sort(
      (a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)
    );
    setMissions(list);
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-tour="page-title">
          Missions
        </h1>
        <Link
          href="/app"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          New Mission
        </Link>
      </div>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Track your active missions and continue work in Studio.
      </p>

      {missions.length === 0 ? (
        <div
          className="rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600"
          data-tour="missions-list"
        >
          No missions yet. Start one from your home dashboard.
        </div>
      ) : (
        <ol className="space-y-3" data-tour="missions-list">
          {missions.map((mission) => {
            const badge = STAGE_BADGE[mission.stage];
            return (
              <li
                key={mission.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{mission.title}</p>
                    <p className="text-xs text-slate-500">
                      Updated {new Date(mission.updatedAtIso).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
                {mission.stage === "in_progress" ? (
                  <div className="mt-3">
                    <Link
                      href="/app/studio"
                      className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Continue in Studio
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
