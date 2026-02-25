import type { OrchestrationJobEnvelope } from "./contracts";
import { isTerminalOrchestrationStatus } from "./stateMachine";

export type WorkerRunContext<TPayload = unknown> = {
  workerId: string;
  startedAtIso: string;
  nowIso: () => string;
  execute: (job: OrchestrationJobEnvelope<TPayload>) => Promise<void>;
};

export type WorkerRunResult = {
  jobId: string;
  status: "succeeded" | "failed" | "skipped";
  reason?: string;
  finishedAtIso: string;
};

export async function runWorkerLifecycle<TPayload = unknown>(
  job: OrchestrationJobEnvelope<TPayload>,
  context: WorkerRunContext<TPayload>
): Promise<WorkerRunResult> {
  if (isTerminalOrchestrationStatus(job.status)) {
    return {
      jobId: job.jobId,
      status: "skipped",
      reason: `job is terminal: ${job.status}`,
      finishedAtIso: context.nowIso()
    };
  }

  try {
    await context.execute(job);
    return {
      jobId: job.jobId,
      status: "succeeded",
      finishedAtIso: context.nowIso()
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown worker error";
    return {
      jobId: job.jobId,
      status: "failed",
      reason,
      finishedAtIso: context.nowIso()
    };
  }
}
