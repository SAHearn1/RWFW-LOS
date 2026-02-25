import type { OrchestrationJobStatus } from "./contracts";

export const ORCHESTRATION_EVENTS = [
  "LEASE",
  "START",
  "SUCCEED",
  "FAIL_RETRYABLE",
  "FAIL_FATAL",
  "CANCEL",
  "DEAD_LETTER"
] as const;

export type OrchestrationEvent = (typeof ORCHESTRATION_EVENTS)[number];

const TRANSITIONS: Readonly<Record<OrchestrationJobStatus, Readonly<Record<OrchestrationEvent, OrchestrationJobStatus | null>>>> = {
  queued: {
    LEASE: "leased",
    START: null,
    SUCCEED: null,
    FAIL_RETRYABLE: null,
    FAIL_FATAL: "failed",
    CANCEL: "cancelled",
    DEAD_LETTER: "dead_letter"
  },
  leased: {
    LEASE: null,
    START: "running",
    SUCCEED: null,
    FAIL_RETRYABLE: "queued",
    FAIL_FATAL: "failed",
    CANCEL: "cancelled",
    DEAD_LETTER: "dead_letter"
  },
  running: {
    LEASE: null,
    START: null,
    SUCCEED: "succeeded",
    FAIL_RETRYABLE: "queued",
    FAIL_FATAL: "failed",
    CANCEL: "cancelled",
    DEAD_LETTER: "dead_letter"
  },
  succeeded: {
    LEASE: null,
    START: null,
    SUCCEED: null,
    FAIL_RETRYABLE: null,
    FAIL_FATAL: null,
    CANCEL: null,
    DEAD_LETTER: null
  },
  failed: {
    LEASE: null,
    START: null,
    SUCCEED: null,
    FAIL_RETRYABLE: null,
    FAIL_FATAL: null,
    CANCEL: null,
    DEAD_LETTER: null
  },
  cancelled: {
    LEASE: null,
    START: null,
    SUCCEED: null,
    FAIL_RETRYABLE: null,
    FAIL_FATAL: null,
    CANCEL: null,
    DEAD_LETTER: null
  },
  dead_letter: {
    LEASE: null,
    START: null,
    SUCCEED: null,
    FAIL_RETRYABLE: null,
    FAIL_FATAL: null,
    CANCEL: null,
    DEAD_LETTER: null
  }
};

const TERMINAL_STATUSES: ReadonlySet<OrchestrationJobStatus> = new Set([
  "succeeded",
  "failed",
  "cancelled",
  "dead_letter"
]);

export function isTerminalOrchestrationStatus(status: OrchestrationJobStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function resolveNextOrchestrationStatus(current: OrchestrationJobStatus, event: OrchestrationEvent): OrchestrationJobStatus {
  const next = TRANSITIONS[current][event];
  if (!next) {
    throw new Error(`Invalid orchestration transition: ${current} -> ${event}`);
  }

  return next;
}

export function canTransitionOrchestrationStatus(current: OrchestrationJobStatus, event: OrchestrationEvent): boolean {
  return TRANSITIONS[current][event] !== null;
}
