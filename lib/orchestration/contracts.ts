export const ORCHESTRATION_JOB_STATUSES = [
  "queued",
  "leased",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "dead_letter"
] as const;

export type OrchestrationJobStatus = (typeof ORCHESTRATION_JOB_STATUSES)[number];

export type OrchestrationJobPriority = "low" | "normal" | "high";

export type RetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
};

export type OrchestrationJobEnvelope<TPayload = unknown> = {
  jobId: string;
  idempotencyKey: string;
  createdAtIso: string;
  updatedAtIso: string;
  status: OrchestrationJobStatus;
  attempt: number;
  priority: OrchestrationJobPriority;
  retryPolicy: RetryPolicy;
  payload: TPayload;
  lastErrorCode?: string;
  lastErrorMessage?: string;
};

export type OrchestrationStateTransition = {
  from: OrchestrationJobStatus;
  to: OrchestrationJobStatus;
  reason: string;
  occurredAtIso: string;
};

export type QueueLeaseRequest = {
  workerId: string;
  leaseTtlMs: number;
  nowIso: string;
};

export type QueueLeaseResult<TPayload = unknown> = {
  leased: boolean;
  job?: OrchestrationJobEnvelope<TPayload>;
  reason?: string;
};
