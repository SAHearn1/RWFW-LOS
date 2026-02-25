"use client";

import { useEffect, useState } from "react";

import { createInitialCoreSessionState, mergeCoreSessionState } from "@/lib/coreState/session";

const STORAGE_KEY = "rootwork.core.session";

export default function PLEHome() {
  const [missionDraft, setMissionDraft] = useState("");

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
    const current = createInitialCoreSessionState();
    const next = mergeCoreSessionState(current, { missionDraft });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [missionDraft]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (PLE)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Plan missions, track progress, and launch studio work from this learner workspace.
      </p>
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
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600" data-tour="studio-entry">
        PLE migration is active in Next.js. Continue to Studio to refine your artifact draft.
      </div>
    </section>
  );
}
