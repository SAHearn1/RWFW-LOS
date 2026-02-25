"use client";

import { useEffect, useState } from "react";

import { createInitialCoreSessionState, mergeCoreSessionState } from "@/lib/coreState/session";

const STORAGE_KEY = "rootwork.core.session";

export default function StudioWorkspace() {
  const [artifactDraft, setArtifactDraft] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { missionDraft?: string; lastStudioArtifact?: string };
      const initial = parsed.lastStudioArtifact ?? parsed.missionDraft ?? "";
      setArtifactDraft(initial);
    } catch {
      // Ignore malformed storage and preserve deterministic fallback.
    }
  }, []);

  useEffect(() => {
    const current = createInitialCoreSessionState();
    const next = mergeCoreSessionState(current, { lastStudioArtifact: artifactDraft });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [artifactDraft]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Studio</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Create, revise, and submit artifacts in the studio workspace.
      </p>
      <label className="block space-y-2" data-tour="studio-artifact">
        <span className="text-sm font-medium text-slate-700">Artifact Draft</span>
        <textarea
          className="w-full rounded border border-slate-300 p-2 text-sm"
          rows={6}
          placeholder="Build your studio artifact..."
          value={artifactDraft}
          onChange={(event) => setArtifactDraft(event.target.value)}
        />
      </label>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        Studio migration is active in Next.js with deterministic placeholder behavior.
      </div>
    </section>
  );
}
