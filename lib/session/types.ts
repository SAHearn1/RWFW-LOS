import type { SessionPhase } from "@/lib/cognition/session";

export type SessionStatus = "idle" | "running" | "paused" | "complete";

export type SessionState = {
  phase: SessionPhase;
  status: SessionStatus;
  elapsedSeconds: number;       // seconds elapsed within current phase
  totalElapsedSeconds: number;  // seconds elapsed across the full session
  phaseStartedAtMs: number;     // wall clock when current phase began
  sessionStartedAtMs: number;   // wall clock when session began
};

export type SessionAction =
  | { type: "START_SESSION" }
  | { type: "ADVANCE_PHASE" }
  | { type: "PAUSE_SESSION" }
  | { type: "RESUME_SESSION" }
  | { type: "TICK"; deltaSeconds: number };
