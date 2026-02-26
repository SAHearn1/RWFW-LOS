import { SESSION_PHASES_ORDERED } from "@/lib/cognition/session";
import type { SessionAction, SessionState } from "./types";

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  const now = Date.now();

  switch (action.type) {
    case "START_SESSION": {
      if (state.status !== "idle") return state;
      return {
        ...state,
        status: "running",
        phase: SESSION_PHASES_ORDERED[0],
        elapsedSeconds: 0,
        totalElapsedSeconds: 0,
        phaseStartedAtMs: now,
        sessionStartedAtMs: now,
      };
    }

    case "TICK": {
      if (state.status !== "running") return state;
      return {
        ...state,
        elapsedSeconds: state.elapsedSeconds + action.deltaSeconds,
        totalElapsedSeconds: state.totalElapsedSeconds + action.deltaSeconds,
      };
    }

    case "ADVANCE_PHASE": {
      const currentIndex = SESSION_PHASES_ORDERED.indexOf(state.phase);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= SESSION_PHASES_ORDERED.length) {
        return { ...state, status: "complete" };
      }
      return {
        ...state,
        phase: SESSION_PHASES_ORDERED[nextIndex],
        elapsedSeconds: 0,
        phaseStartedAtMs: now,
      };
    }

    case "PAUSE_SESSION": {
      if (state.status !== "running") return state;
      return { ...state, status: "paused" };
    }

    case "RESUME_SESSION": {
      if (state.status !== "paused") return state;
      return { ...state, status: "running", phaseStartedAtMs: now };
    }

    default:
      return state;
  }
}
