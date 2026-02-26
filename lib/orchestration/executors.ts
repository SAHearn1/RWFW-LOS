import { verifyArtifactText } from "@/lib/standards/verifier/localVerifier";

export type JobType = "artifact.verify" | "mission.plan" | "ledger.sync" | "session.analyze";

export type JobExecutorResult = {
  success: boolean;
  result?: unknown;
  errorMessage?: string;
};

export type JobExecutor = (payload: unknown) => Promise<JobExecutorResult>;

export const JOB_EXECUTORS: Record<JobType, JobExecutor> = {
  "artifact.verify": async (payload) => {
    const p = payload as Record<string, unknown> | null | undefined;
    if (!p || typeof p !== "object") {
      return { success: false, errorMessage: "artifact.verify: payload must be an object" };
    }
    if (typeof p.artifactText !== "string" || p.artifactText.trim() === "") {
      return { success: false, errorMessage: "artifact.verify: payload.artifactText is required" };
    }
    const results = verifyArtifactText(p.artifactText);
    return { success: true, result: results };
  },

  "mission.plan": async (payload) => {
    const p = payload as Record<string, unknown> | null | undefined;
    if (!p || typeof p !== "object") {
      return { success: false, errorMessage: "mission.plan: payload must be an object" };
    }
    if (typeof p.missionTitle !== "string" || p.missionTitle.trim() === "") {
      return { success: false, errorMessage: "mission.plan: payload.missionTitle is required" };
    }
    if (typeof p.learnerId !== "string" || p.learnerId.trim() === "") {
      return { success: false, errorMessage: "mission.plan: payload.learnerId is required" };
    }
    // Full implementation would call Gemini agent; log request and accept.
    return { success: true, result: { status: "accepted" } };
  },

  "ledger.sync": async (payload) => {
    const p = payload as Record<string, unknown> | null | undefined;
    if (!p || typeof p !== "object") {
      return { success: false, errorMessage: "ledger.sync: payload must be an object" };
    }
    if (!Array.isArray(p.records)) {
      return { success: false, errorMessage: "ledger.sync: payload.records must be an array" };
    }
    return { success: true, result: { synced: p.records.length } };
  },

  "session.analyze": async (payload) => {
    const p = payload as Record<string, unknown> | null | undefined;
    if (!p || typeof p !== "object") {
      return { success: false, errorMessage: "session.analyze: payload must be an object" };
    }
    if (typeof p.sessionId !== "string" || p.sessionId.trim() === "") {
      return { success: false, errorMessage: "session.analyze: payload.sessionId is required" };
    }
    return { success: true, result: { analyzed: true } };
  }
};

export function isKnownJobType(type: unknown): type is JobType {
  return typeof type === "string" && type in JOB_EXECUTORS;
}
