"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { phase3FeatureFlags } from "@/lib/config/featureFlags";
import { createInitialCoreSessionState, mergeCoreSessionState } from "@/lib/coreState/session";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
import type { LedgerRecord } from "@/lib/ledger/adapter";
import type { VerificationEvent } from "@/lib/runtime/contracts/types";
import { dispatchRuntimeEvent, readRuntimeState } from "@/lib/runtime/engine/store";
import { runStandardsPlugins } from "@/lib/standards/contracts/plugins";

import type { UploadedFile } from "./modalities/FileUploadInput";
import type { VoiceNote } from "./modalities/VoiceNoteInput";

// Dynamically import heavier components (client-only)
const SessionPhaseBar = dynamic(() => import("./SessionPhaseBar"), { ssr: false });
const ReflectionDock = dynamic(() => import("./ReflectionDock"), { ssr: false });
const ThinkingPartnerPanel = dynamic(() => import("./ThinkingPartnerPanel"), { ssr: false });
const FileUploadInput = dynamic(() => import("./modalities/FileUploadInput"), { ssr: false });
const VoiceNoteInput = dynamic(() => import("./modalities/VoiceNoteInput"), { ssr: false });

const STORAGE_KEY = "rootwork.core.session";
const MISSION_ID = "mission.primary";
const LEARNER_ID = "learner.local";

function readRuntimeMissionState(): string {
  if (!phase3FeatureFlags.enableRuntime) {
    return "runtime_disabled";
  }
  return readRuntimeState().missions[MISSION_ID]?.stage ?? "not_started";
}

export default function StudioWorkspace() {
  const [artifactDraft, setArtifactDraft] = useState("");
  const [lastSavedIso, setLastSavedIso] = useState<string | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<string>("No verification recorded yet.");
  const [runtimeMissionState, setRuntimeMissionState] = useState<string>(() => readRuntimeMissionState());
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { missionDraft?: string; lastStudioArtifact?: string };
      const initial = parsed.lastStudioArtifact ?? parsed.missionDraft ?? "";
      setArtifactDraft(initial);
    } catch {
      // Ignore malformed storage and preserve deterministic fallback.
    }
  }, []);

  const saveSessionState = useCallback((draft: string) => {
    const current = createInitialCoreSessionState();
    const next = mergeCoreSessionState(current, { lastStudioArtifact: draft });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    saveSessionState(artifactDraft);
  }, [artifactDraft, saveSessionState]);

  const ledger = useMemo(() => localLedgerAdapter, []);

  const handleReflectionSave = useCallback((entry: { step: string; text: string; savedAt: string }) => {
    if (!phase3FeatureFlags.enableLedger) return;
    const now = entry.savedAt;
    const record: LedgerRecord = {
      id: `ledger.reflection.${entry.step}.${Date.now()}`,
      type: "reflection",
      missionId: MISSION_ID,
      learnerId: LEARNER_ID,
      payload: { step: entry.step, text: entry.text },
      createdAtIso: now,
      updatedAtIso: now,
      dataTier: "tier-3",
    };
    ledger.upsert(record);
  }, [ledger]);

  const saveArtifact = useCallback(() => {
    if (!phase3FeatureFlags.enableRuntime && !phase3FeatureFlags.enableLedger) return;

    const now = new Date().toISOString();
    const artifactId = "artifact.primary";

    // Determine modality
    const modality = voiceNote ? "voice" : uploadedFile ? "upload" : "text";
    const content = voiceNote
      ? voiceNote.base64
      : uploadedFile
        ? uploadedFile.base64
        : artifactDraft;

    if (phase3FeatureFlags.enableRuntime) {
      dispatchRuntimeEvent({
        type: "ARTIFACT_SAVED",
        artifact: {
          id: artifactId,
          missionId: MISSION_ID,
          learnerId: LEARNER_ID,
          content,
          updatedAtIso: now,
          modality,
        },
      });
    }

    if (phase3FeatureFlags.enableLedger) {
      ledger.upsert({
        id: `ledger.artifact.${artifactId}`,
        type: "artifact",
        missionId: MISSION_ID,
        learnerId: LEARNER_ID,
        payload: {
          id: artifactId,
          missionId: MISSION_ID,
          learnerId: LEARNER_ID,
          content,
          updatedAtIso: now,
          modality,
        },
        createdAtIso: now,
        updatedAtIso: now,
        dataTier: "tier-1",
      });
    }

    if (phase3FeatureFlags.enableStandardsVerifier) {
      const results = runStandardsPlugins({ artifactText: artifactDraft });
      const verification: VerificationEvent = {
        id: `verification.${Date.now()}`,
        missionId: MISSION_ID,
        artifactId,
        standards: results.map((r) => r.standardId),
        verdict: results.some((r) => r.verdict === "missing")
          ? "missing"
          : results.some((r) => r.verdict === "partial")
            ? "partial"
            : "pass",
        createdAtIso: now,
      };

      if (phase3FeatureFlags.enableRuntime) {
        dispatchRuntimeEvent({ type: "VERIFICATION_RECORDED", verification });
      }

      if (phase3FeatureFlags.enableLedger) {
        ledger.upsert({
          id: `ledger.verification.${verification.id}`,
          type: "verification",
          missionId: MISSION_ID,
          learnerId: LEARNER_ID,
          payload: verification,
          createdAtIso: now,
          updatedAtIso: now,
          dataTier: "tier-0",
        });
      }

      const verdictCounts = results.reduce(
        (acc, r) => { acc[r.verdict] += 1; return acc; },
        { pass: 0, partial: 0, missing: 0 }
      );
      setVerificationSummary(
        `Pass: ${verdictCounts.pass}, Partial: ${verdictCounts.partial}, Missing: ${verdictCounts.missing}`
      );
    } else {
      setVerificationSummary("Standards verifier disabled.");
    }

    setLastSavedIso(now);
    setRuntimeMissionState(readRuntimeMissionState());
  }, [artifactDraft, ledger, uploadedFile, voiceNote]);

  const canSave = phase3FeatureFlags.enableRuntime || phase3FeatureFlags.enableLedger;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Studio</h1>

      {/* TRACE Session Phase Bar */}
      {phase3FeatureFlags.enableRuntime && (
        <SessionPhaseBar />
      )}

      <p className="text-sm text-slate-700" data-tour="page-description">
        Create, revise, and submit artifacts in the studio workspace.
      </p>

      {!phase3FeatureFlags.enableLedger && (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ledger is disabled. Enable <code>NEXT_PUBLIC_ENABLE_LEDGER</code> to persist evidence.
        </p>
      )}

      <p className="text-sm text-slate-600">Linked mission status: {runtimeMissionState}</p>

      {/* Main workspace: artifact + thinking partner */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 space-y-3">
          <label className="block space-y-2" data-tour="studio-artifact">
            <span className="text-sm font-medium text-slate-700">Artifact Draft</span>
            <textarea
              className="w-full rounded border border-slate-300 p-2 text-sm"
              rows={8}
              placeholder="Build your studio artifact…"
              value={artifactDraft}
              onChange={(e) => setArtifactDraft(e.target.value)}
            />
          </label>

          {/* Multimodal inputs */}
          <div className="space-y-2">
            <FileUploadInput onFile={setUploadedFile} currentFile={uploadedFile} />
            <VoiceNoteInput onVoiceNote={setVoiceNote} currentNote={voiceNote} />
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              type="button"
              onClick={saveArtifact}
              data-tour="artifact-save"
              disabled={!canSave}
            >
              Save Artifact
            </button>
            {lastSavedIso && (
              <span className="text-xs text-slate-500">Saved at {lastSavedIso.slice(11, 19)} UTC</span>
            )}
          </div>

          <p className="text-sm text-slate-600" data-tour="verification-summary">
            Verification: {verificationSummary}
          </p>
        </div>

        {/* Thinking Partner sidebar */}
        <ThinkingPartnerPanel
          missionTitle="Primary Mission"
          artifactDraft={artifactDraft}
        />
      </div>

      {/* Reflection Dock */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <ReflectionDock missionId={MISSION_ID} onSave={handleReflectionSave} />
      </div>
    </section>
  );
}
