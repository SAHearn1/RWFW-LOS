import { NextResponse } from "next/server";

import type { OrchestrationJobEnvelope, OrchestrationJobPriority } from "@/lib/orchestration/contracts";
import { InMemoryQueueAdapter } from "@/lib/orchestration/queueAdapter";
import { runWorkerLifecycle } from "@/lib/orchestration/workerRunner";
import { isKnownJobType, JOB_EXECUTORS } from "@/lib/orchestration/executors";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const body = (await request.json()) as {
    jobId?: string;
    idempotencyKey?: string;
    priority?: OrchestrationJobPriority;
    payload?: { type?: unknown; [key: string]: unknown };
  };

  if (!body.jobId || typeof body.jobId !== "string" || body.jobId.trim() === "") {
    return NextResponse.json(
      { error: "jobId is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!body.idempotencyKey || typeof body.idempotencyKey !== "string" || body.idempotencyKey.trim() === "") {
    return NextResponse.json(
      { error: "idempotencyKey is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!body.payload || typeof body.payload !== "object" || !isKnownJobType(body.payload.type)) {
    return NextResponse.json(
      { error: "payload.type is required and must be a known job type" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const nowIso = new Date().toISOString();
  const priority: OrchestrationJobPriority = body.priority ?? "normal";

  const jobEnvelope: OrchestrationJobEnvelope = {
    jobId: body.jobId,
    idempotencyKey: body.idempotencyKey,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    status: "queued",
    attempt: 0,
    priority,
    retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
    payload: body.payload ?? null
  };

  const queue = new InMemoryQueueAdapter();
  const enqueued = queue.enqueue(jobEnvelope);

  recordAuditEvent({
    traceId,
    eventType: "orchestration.job.submitted",
    role: "unknown",
    severity: "info",
    createdAtIso: nowIso,
    metadata: {
      jobId: enqueued.jobId,
      idempotencyKey: enqueued.idempotencyKey,
      priority: enqueued.priority
    }
  });

  const leaseResult = queue.leaseNext({
    workerId: `worker-${traceId}`,
    leaseTtlMs: 30000,
    nowIso
  });

  if (!leaseResult.leased || !leaseResult.job) {
    return NextResponse.json(
      { accepted: true, jobId: enqueued.jobId },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const leasedJob = leaseResult.job;
  const runResult = await runWorkerLifecycle(leasedJob, {
    workerId: `worker-${traceId}`,
    startedAtIso: nowIso,
    nowIso: () => new Date().toISOString(),
    execute: async (job) => {
      const jobType = (job.payload as Record<string, unknown>)?.type;
      if (!isKnownJobType(jobType)) {
        throw new Error(`Unknown job type: ${String(jobType)}`);
      }
      const executor = JOB_EXECUTORS[jobType];
      const execResult = await executor(job.payload);
      if (!execResult.success) {
        throw new Error(execResult.errorMessage ?? "Executor returned failure");
      }
    }
  });

  return NextResponse.json(
    { accepted: true, jobId: enqueued.jobId, runStatus: runResult.status },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
