export type RuntimeMissionStage = "not_started" | "in_progress" | "submitted" | "verified";

export type RuntimeMission = {
  id: string;
  learnerId: string;
  title: string;
  stage: RuntimeMissionStage;
  updatedAtIso: string;
};

export type RuntimeArtifact = {
  id: string;
  missionId: string;
  learnerId: string;
  content: string;
  updatedAtIso: string;
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
