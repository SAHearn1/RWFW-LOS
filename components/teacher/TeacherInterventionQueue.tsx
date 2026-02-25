"use client";

import { useMemo } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { readRuntimeState } from "@/lib/runtime/engine/store";
import type { RuntimeMissionStage } from "@/lib/runtime/contracts/types";

type QueueItem = {
  missionId: string;
  learnerId: string;
  stage: RuntimeMissionStage;
  artifactCount: number;
  partialCount: number;
  missingCount: number;
  urgency: number;
  rationale: string;
};

const STAGE_URGENCY: Record<RuntimeMissionStage, number> = {
  not_started: 20,
  in_progress: 40,
  submitted: 60,
  verified: 0
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function scoreItem(input: Omit<QueueItem, "urgency" | "rationale">): Pick<QueueItem, "urgency" | "rationale"> {
  const parts: string[] = [];
  let score = STAGE_URGENCY[input.stage];
  parts.push(`stage:${input.stage}=${STAGE_URGENCY[input.stage]}`);

  if (input.artifactCount === 0) {
    score += 10;
    parts.push("no_artifact=+10");
  }

  if (input.partialCount > 0) {
    const delta = input.partialCount * 15;
    score += delta;
    parts.push(`partial:${input.partialCount}=+${delta}`);
  }

  if (input.missingCount > 0) {
    const delta = input.missingCount * 30;
    score += delta;
    parts.push(`missing:${input.missingCount}=+${delta}`);
  }

  return {
    urgency: clamp(score),
    rationale: parts.join(", ")
  };
}

export default function TeacherInterventionQueue() {
  const queue = useMemo<QueueItem[]>(() => {
    const runtime = readRuntimeState();
    const records = localLedgerAdapter.readAll();

    const verificationByMission = new Map<string, { partial: number; missing: number }>();
    const artifactsByMission = new Map<string, number>();

    for (const record of records) {
      if (record.type === "artifact") {
        artifactsByMission.set(record.missionId, (artifactsByMission.get(record.missionId) ?? 0) + 1);
      }

      if (record.type === "verification") {
        const verdict = (record.payload as { verdict?: string }).verdict;
        const current = verificationByMission.get(record.missionId) ?? { partial: 0, missing: 0 };

        if (verdict === "partial") {
          current.partial += 1;
        }

        if (verdict === "missing") {
          current.missing += 1;
        }

        verificationByMission.set(record.missionId, current);
      }
    }

    const items = Object.values(runtime.missions).map((mission) => {
      const verification = verificationByMission.get(mission.id) ?? { partial: 0, missing: 0 };
      const artifactCount = artifactsByMission.get(mission.id) ?? 0;

      const scored = scoreItem({
        missionId: mission.id,
        learnerId: mission.learnerId,
        stage: mission.stage,
        artifactCount,
        partialCount: verification.partial,
        missingCount: verification.missing
      });

      return {
        missionId: mission.id,
        learnerId: mission.learnerId,
        stage: mission.stage,
        artifactCount,
        partialCount: verification.partial,
        missingCount: verification.missing,
        urgency: scored.urgency,
        rationale: scored.rationale
      };
    });

    return items.sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return b.urgency - a.urgency;
      }

      return a.missionId.localeCompare(b.missionId);
    });
  }, []);

  return (
    <section className="space-y-4" data-tour="teacher-intervention-queue">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Teacher Intervention Queue</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Deterministic urgency scoring prioritizes missions needing facilitator intervention.
      </p>

      {queue.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No runtime missions found yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Mission</th>
                <th className="px-3 py-2">Learner</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Urgency</th>
                <th className="px-3 py-2">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.missionId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{item.missionId}</td>
                  <td className="px-3 py-2 text-slate-700">{item.learnerId}</td>
                  <td className="px-3 py-2 text-slate-700">{item.stage}</td>
                  <td className="px-3 py-2 text-slate-900">{item.urgency}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{item.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
