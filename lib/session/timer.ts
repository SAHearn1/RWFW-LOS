"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import { SESSION_PHASES } from "@/lib/cognition/session";
import { createInitialSessionState, isPhaseComplete, sessionReducer } from "./engine";
import type { SessionState } from "./types";

const TICK_INTERVAL_MS = 1000;

export type UseSessionTimerResult = {
  state: SessionState;
  start: () => void;
  advancePhase: () => void;
  pause: () => void;
  resume: () => void;
  phaseDurationSeconds: number;
  phaseLabel: string;
};

export function useSessionTimer(): UseSessionTimerResult {
  const [state, dispatch] = useReducer(sessionReducer, createInitialSessionState());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTicker = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.status === "running") {
      intervalRef.current = setInterval(() => {
        dispatch({ type: "TICK", deltaSeconds: 1 });
      }, TICK_INTERVAL_MS);
    } else {
      clearTicker();
    }
    return clearTicker;
  }, [state.status, clearTicker]);

  // Auto-advance phase when time expires
  useEffect(() => {
    if (state.status === "running" && isPhaseComplete(state)) {
      dispatch({ type: "ADVANCE_PHASE" });
    }
  }, [state]);

  const phaseDurationSeconds = SESSION_PHASES[state.phase].duration * 60;
  const phaseLabel = SESSION_PHASES[state.phase].label;

  return {
    state,
    start: useCallback(() => dispatch({ type: "START_SESSION" }), []),
    advancePhase: useCallback(() => dispatch({ type: "ADVANCE_PHASE" }), []),
    pause: useCallback(() => dispatch({ type: "PAUSE_SESSION" }), []),
    resume: useCallback(() => dispatch({ type: "RESUME_SESSION" }), []),
    phaseDurationSeconds,
    phaseLabel,
  };
}
