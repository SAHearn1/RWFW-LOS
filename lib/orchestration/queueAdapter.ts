import type { OrchestrationJobEnvelope, OrchestrationJobPriority, QueueLeaseRequest, QueueLeaseResult } from "./contracts";
import { canTransitionOrchestrationStatus, resolveNextOrchestrationStatus } from "./stateMachine";

function priorityScore(priority: OrchestrationJobPriority): number {
  switch (priority) {
    case "high":
      return 3;
    case "normal":
      return 2;
    case "low":
    default:
      return 1;
  }
}

type QueueSnapshot<TPayload> = {
  jobs: OrchestrationJobEnvelope<TPayload>[];
};

export class InMemoryQueueAdapter<TPayload = unknown> {
  private readonly jobsById = new Map<string, OrchestrationJobEnvelope<TPayload>>();
  private readonly jobIdByIdempotency = new Map<string, string>();

  snapshot(): QueueSnapshot<TPayload> {
    return {
      jobs: [...this.jobsById.values()]
    };
  }

  enqueue(job: OrchestrationJobEnvelope<TPayload>): OrchestrationJobEnvelope<TPayload> {
    const existingId = this.jobIdByIdempotency.get(job.idempotencyKey);
    if (existingId) {
      const existing = this.jobsById.get(existingId);
      if (existing) {
        return existing;
      }
    }

    this.jobsById.set(job.jobId, job);
    this.jobIdByIdempotency.set(job.idempotencyKey, job.jobId);
    return job;
  }

  leaseNext(request: QueueLeaseRequest): QueueLeaseResult<TPayload> {
    const queued = [...this.jobsById.values()]
      .filter((job) => job.status === "queued")
      .sort((a, b) => {
        const byPriority = priorityScore(b.priority) - priorityScore(a.priority);
        if (byPriority !== 0) {
          return byPriority;
        }
        return a.createdAtIso.localeCompare(b.createdAtIso);
      });

    const candidate = queued[0];
    if (!candidate) {
      return { leased: false, reason: "no queued jobs" };
    }

    if (!canTransitionOrchestrationStatus(candidate.status, "LEASE")) {
      return { leased: false, reason: "invalid transition" };
    }

    const leased: OrchestrationJobEnvelope<TPayload> = {
      ...candidate,
      status: resolveNextOrchestrationStatus(candidate.status, "LEASE"),
      updatedAtIso: request.nowIso
    };

    this.jobsById.set(candidate.jobId, leased);

    return {
      leased: true,
      job: leased
    };
  }

  markStarted(jobId: string, nowIso: string): OrchestrationJobEnvelope<TPayload> {
    const job = this.mustGet(jobId);
    const next = {
      ...job,
      status: resolveNextOrchestrationStatus(job.status, "START"),
      updatedAtIso: nowIso
    };
    this.jobsById.set(jobId, next);
    return next;
  }

  markSucceeded(jobId: string, nowIso: string): OrchestrationJobEnvelope<TPayload> {
    const job = this.mustGet(jobId);
    const next = {
      ...job,
      status: resolveNextOrchestrationStatus(job.status, "SUCCEED"),
      updatedAtIso: nowIso,
      lastErrorCode: undefined,
      lastErrorMessage: undefined
    };
    this.jobsById.set(jobId, next);
    return next;
  }

  markFailed(jobId: string, nowIso: string, code: string, message: string, retryable: boolean): OrchestrationJobEnvelope<TPayload> {
    const job = this.mustGet(jobId);

    const shouldRetry = retryable && job.attempt < job.retryPolicy.maxAttempts;
    const event = shouldRetry ? "FAIL_RETRYABLE" : "FAIL_FATAL";

    const next = {
      ...job,
      status: resolveNextOrchestrationStatus(job.status, event),
      updatedAtIso: nowIso,
      attempt: shouldRetry ? job.attempt + 1 : job.attempt,
      lastErrorCode: code,
      lastErrorMessage: message
    };

    this.jobsById.set(jobId, next);
    return next;
  }

  private mustGet(jobId: string): OrchestrationJobEnvelope<TPayload> {
    const job = this.jobsById.get(jobId);
    if (!job) {
      throw new Error(`Unknown jobId: ${jobId}`);
    }

    return job;
  }
}
