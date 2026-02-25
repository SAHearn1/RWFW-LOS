import type { FederationTaskEnvelope } from "@/lib/federation/types";
import { runWorkerLifecycle } from "@/lib/orchestration/workerRunner";

export type FederationDispatchResult = {
  status: "success" | "error";
  output?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function buildDispatchPayload(task: FederationTaskEnvelope, assignedAgentId: string): Record<string, unknown> {
  return {
    accepted: true,
    assignedAgentId,
    capabilityId: task.capabilityId,
    taskId: task.taskId,
    correlationId: task.correlationId,
    payload: task.payload,
    dispatchedAtIso: nowIso()
  };
}

export async function dispatchFederationTask(
  task: FederationTaskEnvelope,
  assignedAgentId: string
): Promise<FederationDispatchResult> {
  const lifecycle = await runWorkerLifecycle(
    {
      jobId: `federation.${task.taskId}`,
      idempotencyKey: `federation.${task.correlationId}`,
      createdAtIso: nowIso(),
      updatedAtIso: nowIso(),
      status: "running",
      attempt: 1,
      priority: "normal",
      retryPolicy: { maxAttempts: 1, backoffMs: 0 },
      payload: task.payload
    },
    {
      workerId: assignedAgentId,
      startedAtIso: nowIso(),
      nowIso,
      execute: async () => {
        if (!["federation.route", "runtime.execute", "standards.verify"].includes(task.capabilityId)) {
          throw new Error(`unsupported_capability:${task.capabilityId}`);
        }
      }
    }
  );

  if (lifecycle.status === "failed") {
    return {
      status: "error",
      errorCode: "dispatch_failed",
      errorMessage: lifecycle.reason ?? "unknown_dispatch_error"
    };
  }

  return {
    status: "success",
    output: buildDispatchPayload(task, assignedAgentId)
  };
}
