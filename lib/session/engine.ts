import { SESSION_PHASES } from "@/lib/cognition/session";
import { sessionReducer } from "./reducer";
import type { SessionState, SessionStatus } from "./types";

export type { SessionState, SessionStatus };

export function createInitialSessionState(): SessionState {
  return {
    phase: "arrival",
    status: "idle",
    elapsedSeconds: 0,
    totalElapsedSeconds: 0,
    phaseStartedAtMs: 0,
    sessionStartedAtMs: 0,
  };
}

export function getPhaseDurationSeconds(state: SessionState): number {
  return SESSION_PHASES[state.phase].duration * 60;
}

export function getPhaseProgressRatio(state: SessionState): number {
  const duration = getPhaseDurationSeconds(state);
  if (duration === 0) return 1;
  return Math.min(state.elapsedSeconds / duration, 1);
}

export function isPhaseComplete(state: SessionState): boolean {
  return state.elapsedSeconds >= getPhaseDurationSeconds(state);
}

export { sessionReducer };
