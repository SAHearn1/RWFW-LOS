/**
 * Session phase event helpers for TRACE learning analytics.
 *
 * Phase transition events are stored in localStorage under a dedicated key so
 * that runtime consumers (analytics, portfolio, etc.) can read them without
 * coupling to the runtime store's RuntimeEvent discriminated union.
 *
 * Key: "rootwork.session.phaseEvents"
 * Shape: SessionPhaseEvent[]
 */

import type { SessionPhase } from "@/lib/cognition/session";
import type { TraceStep } from "@/lib/cognition/trace";

export type SessionPhaseEvent = {
  sessionId: string;
  phase: SessionPhase;
  traceStep: TraceStep | "reflect";
  elapsedSecondsInPhase: number;
  totalElapsedSeconds: number;
  timestamp: string; // ISO-8601
};

/** Maps each session phase to its corresponding TRACE step label. */
export const SESSION_PHASE_TO_TRACE_STEP: Record<SessionPhase, TraceStep | "reflect"> = {
  arrival: "regulate",
  orientation: "trigger",
  "deep-work": "construct",
  collaboration: "attend",
  expression: "express",
  closure: "reflect",
} as const;

const PHASE_EVENTS_STORAGE_KEY = "rootwork.session.phaseEvents";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Appends a session phase transition event to the localStorage array.
 * Safe to call in browser-only ("use client") contexts.
 * No-ops silently when localStorage is unavailable (SSR, test envs).
 */
export function appendSessionPhaseEvent(event: SessionPhaseEvent): void {
  if (!canUseLocalStorage()) {
    return;
  }

  let existing: SessionPhaseEvent[] = [];

  try {
    const raw = window.localStorage.getItem(PHASE_EVENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        existing = parsed as SessionPhaseEvent[];
      }
    }
  } catch {
    // Corrupted data — start fresh.
    existing = [];
  }

  existing.push(event);

  try {
    window.localStorage.setItem(PHASE_EVENTS_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Storage quota exceeded or other write error — fail silently.
  }
}

/**
 * Reads all session phase events from localStorage.
 * Returns an empty array when unavailable or on parse failure.
 */
export function readSessionPhaseEvents(): SessionPhaseEvent[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PHASE_EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SessionPhaseEvent[]) : [];
  } catch {
    return [];
  }
}
