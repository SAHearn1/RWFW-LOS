import type { ArtifactModality } from "@/lib/cognition/rigor";
import type { SessionPhase } from "@/lib/cognition/session";
import type { TraceStep } from "@/lib/cognition/trace";

export type RuntimeMissionStage = "not_started" | "in_progress" | "submitted" | "verified";

export type RuntimeMission = {
  id: string;
  learnerId: string;
  title: string;
  stage: RuntimeMissionStage;
  updatedAtIso: string;
  // TRACE / session enrichment (optional — populated by session engine)
  tracePhase?: TraceStep;
  sessionPhase?: SessionPhase;
};

export type RuntimeArtifact = {
  id: string;
  missionId: string;
  learnerId: string;
  content: string;
  updatedAtIso: string;
  // Modality: default "text"; set by multimodal inputs (ticket #223)
  modality?: ArtifactModality;
  // Reasoning metadata (ticket #211)
  reasoning?: string;
};

export type VerificationEvent = {
  id: string;
  missionId: string;
  artifactId: string;
  standards: string[];
  verdict: "pass" | "partial" | "missing";
  createdAtIso: string;
};

export type RuntimeEvent =
  | { type: "MISSION_STARTED"; mission: RuntimeMission }
  | { type: "MISSION_ADVANCED"; missionId: string; stage: RuntimeMissionStage; updatedAtIso: string }
  | { type: "ARTIFACT_SAVED"; artifact: RuntimeArtifact }
  | { type: "VERIFICATION_RECORDED"; verification: VerificationEvent };
