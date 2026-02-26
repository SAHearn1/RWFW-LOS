"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { phase3FeatureFlags } from "@/lib/config/featureFlags";

const JoinCohortPanel = dynamic(() => import("@/components/cohorts/JoinCohortPanel"), { ssr: false });
import { createInitialCoreSessionState, mergeCoreSessionState } from "@/lib/coreState/session";
import type { RuntimeMissionStage } from "@/lib/runtime/contracts/types";
import { dispatchRuntimeEvent, readRuntimeState } from "@/lib/runtime/engine/store";

const STORAGE_KEY = "rootwork.core.session";
const MISSION_ID = "mission.primary";
const LEARNER_ID = "learner.local";

function nextMissionStageFromDraft(draft: string): RuntimeMissionStage {
  return draft.trim().length > 0 ? "in_progress" : "not_started";
}

export default function PLEHome() {
  const [missionDraft, setMissionDraft] = useState("");
  const [missionStage, setMissionStage] = useState<RuntimeMissionStage>("not_started");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { missionDraft?: string };
      if (typeof parsed.missionDraft === "string") {
        setMissionDraft(parsed.missionDraft);
      }
    } catch {
      // Ignore malformed client storage; deterministic defaults are applied.
    }
  }, []);

  useEffect(() => {
    if (!phase3FeatureFlags.enableRuntime) {
      return;
    }

    const runtimeState = readRuntimeState();
    const mission = runtimeState.missions[MISSION_ID];
    if (mission) {
      setMissionStage(mission.stage);
    }
  }, []);

  useEffect(() => {
    const current = createInitialCoreSessionState();
    const next = mergeCoreSessionState(current, { missionDraft });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [missionDraft]);

  const missionSummary = useMemo(() => {
    if (!phase3FeatureFlags.enableRuntime) {
      return "Runtime disabled.";
    }

    if (missionStage === "submitted") {
      return "Submitted and awaiting verification.";
    }

    if (missionStage === "in_progress") {
      return "In progress. Continue refining your objective.";
    }

    return "Not started.";
  }, [missionStage]);

  const startMission = () => {
    if (!phase3FeatureFlags.enableRuntime) {
      return;
    }

    const now = new Date().toISOString();

    dispatchRuntimeEvent({
      type: "MISSION_STARTED",
      mission: {
        id: MISSION_ID,
        learnerId: LEARNER_ID,
        title: missionDraft.trim() || "Untitled Mission",
        stage: nextMissionStageFromDraft(missionDraft),
        updatedAtIso: now
      }
    });

    setMissionStage(nextMissionStageFromDraft(missionDraft));
  };

  const submitMission = () => {
    if (!phase3FeatureFlags.enableRuntime) {
      return;
    }

    const now = new Date().toISOString();
    dispatchRuntimeEvent({
      type: "MISSION_ADVANCED",
      missionId: MISSION_ID,
      stage: "submitted",
      updatedAtIso: now
    });
    setMissionStage("submitted");
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (PLE)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Plan missions, track progress, and launch studio work from this learner workspace.
      </p>
      {!phase3FeatureFlags.enableRuntime ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Runtime is disabled. Enable `NEXT_PUBLIC_ENABLE_RUNTIME` to activate mission events.
        </p>
      ) : null}
      <label className="block space-y-2" data-tour="mission-draft">
        <span className="text-sm font-medium text-slate-700">Mission Draft</span>
        <textarea
          className="w-full rounded border border-slate-300 p-2 text-sm"
          rows={4}
          placeholder="Draft your next mission objective..."
          value={missionDraft}
          onChange={(event) => setMissionDraft(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2" data-tour="mission-actions">
        <button className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50" type="button" onClick={startMission} disabled={!phase3FeatureFlags.enableRuntime}>
          Start Mission
        </button>
        <button className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50" type="button" onClick={submitMission} disabled={!phase3FeatureFlags.enableRuntime}>
          Mark Submitted
        </button>
      </div>
      <p className="text-sm text-slate-600">Mission status: {missionSummary}</p>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600" data-tour="studio-entry">
        PLE migration is active in Next.js. Continue to Studio to refine your artifact draft.
      </div>
      {/* Join a classroom — shown for independent learners */}
      <JoinCohortPanel />
    </section>
  );
}
