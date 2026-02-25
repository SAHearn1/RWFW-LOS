"use client";

import { useEffect, useMemo, useState } from "react";

import { phase3FeatureFlags } from "@/lib/config/featureFlags";
import { createInitialCoreSessionState, mergeCoreSessionState } from "@/lib/coreState/session";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
import type { VerificationEvent } from "@/lib/runtime/contracts/types";
import { dispatchRuntimeEvent, readRuntimeState } from "@/lib/runtime/engine/store";
import { verifyArtifactText } from "@/lib/standards/verifier/localVerifier";

const STORAGE_KEY = "rootwork.core.session";
const MISSION_ID = "mission.primary";
const LEARNER_ID = "learner.local";

export default function StudioWorkspace() {
  const [artifactDraft, setArtifactDraft] = useState("");
  const [lastSavedIso, setLastSavedIso] = useState<string | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<string>("No verification recorded yet.");

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

  const saveArtifact = () => {
    if (!phase3FeatureFlags.enableRuntime && !phase3FeatureFlags.enableLedger) {
      return;
    }

    const now = new Date().toISOString();
    const artifactId = "artifact.primary";

    if (phase3FeatureFlags.enableRuntime) {
      dispatchRuntimeEvent({
        type: "ARTIFACT_SAVED",
        artifact: {
          id: artifactId,
          missionId: MISSION_ID,
          learnerId: LEARNER_ID,
          content: artifactDraft,
          updatedAtIso: now
        }
      });
    }

    if (phase3FeatureFlags.enableLedger) {
      localLedgerAdapter.upsert({
        id: `ledger.artifact.${artifactId}`,
        type: "artifact",
        missionId: MISSION_ID,
        learnerId: LEARNER_ID,
        payload: {
          id: artifactId,
          missionId: MISSION_ID,
          learnerId: LEARNER_ID,
          content: artifactDraft,
          updatedAtIso: now
        },
        createdAtIso: now,
        updatedAtIso: now
      });
    }

    if (phase3FeatureFlags.enableStandardsVerifier) {
      const results = verifyArtifactText(artifactDraft);
      const verification: VerificationEvent = {
        id: `verification.${Date.now()}`,
        missionId: MISSION_ID,
        artifactId,
        standards: results.map((result) => result.standardId),
        verdict: results.some((result) => result.verdict === "missing")
          ? "missing"
          : results.some((result) => result.verdict === "partial")
            ? "partial"
            : "pass",
        createdAtIso: now
      };

      if (phase3FeatureFlags.enableRuntime) {
        dispatchRuntimeEvent({ type: "VERIFICATION_RECORDED", verification });
      }

      if (phase3FeatureFlags.enableLedger) {
        localLedgerAdapter.upsert({
          id: `ledger.verification.${verification.id}`,
          type: "verification",
          missionId: MISSION_ID,
          learnerId: LEARNER_ID,
          payload: verification,
          createdAtIso: now,
          updatedAtIso: now
        });
      }

      const verdictCounts = results.reduce(
        (accumulator, result) => {
          accumulator[result.verdict] += 1;
          return accumulator;
        },
        { pass: 0, partial: 0, missing: 0 }
      );

      setVerificationSummary(`Pass: ${verdictCounts.pass}, Partial: ${verdictCounts.partial}, Missing: ${verdictCounts.missing}`);
    } else {
      setVerificationSummary("Standards verifier disabled.");
    }

    setLastSavedIso(now);
  };

  const runtimeMissionState = useMemo(() => {
    if (!phase3FeatureFlags.enableRuntime) {
      return "runtime_disabled";
    }

    return readRuntimeState().missions[MISSION_ID]?.stage ?? "not_started";
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Studio</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Create, revise, and submit artifacts in the studio workspace.
      </p>
      {!phase3FeatureFlags.enableLedger ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ledger is disabled. Enable `NEXT_PUBLIC_ENABLE_LEDGER` to persist evidence.
        </p>
      ) : null}
      <p className="text-sm text-slate-600">Linked mission status: {runtimeMissionState}</p>
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
      <button className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50" type="button" onClick={saveArtifact} data-tour="artifact-save" disabled={!phase3FeatureFlags.enableRuntime && !phase3FeatureFlags.enableLedger}>
        Save Artifact
      </button>
      <p className="text-sm text-slate-600" data-tour="verification-summary">Verification: {verificationSummary}</p>
      <p className="text-xs text-slate-500">Last saved: {lastSavedIso ?? "Not saved yet"}</p>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        Studio migration is active in Next.js with deterministic placeholder behavior.
      </div>
    </section>
  );
}

