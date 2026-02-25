import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { readAwsRegion, readDynamoTable, readSqsQueueUrl } from "@/lib/cloud/awsEnv";
import type { OrchestrationJobEnvelope, QueueLeaseResult } from "@/lib/orchestration/contracts";
import { DynamoOrchestrationStateStore } from "@/lib/orchestration/dynamoStateStore";
import { InMemoryQueueAdapter } from "@/lib/orchestration/queueAdapter";
import { SqsQueueAdapter } from "@/lib/orchestration/sqsQueueAdapter";
import { runWorkerLifecycle } from "@/lib/orchestration/workerRunner";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

type WorkerRunBody = {
  idempotencyKey?: string;
  priority?: "low" | "normal" | "high";
  payload?: Record<string, unknown>;
  simulateFailure?: boolean;
};

type WorkerBackend = {
  queue: "sqs" | "in_memory";
  stateStore: "dynamodb" | "none";
  fallbackReason?: string;
};

type WorkerExecutionResult = {
  enqueued: OrchestrationJobEnvelope<Record<string, unknown>>;
  lease: QueueLeaseResult<Record<string, unknown>>;
  lifecycle: Awaited<ReturnType<typeof runWorkerLifecycle>>;
  finalJob: OrchestrationJobEnvelope<Record<string, unknown>>;
  backend: WorkerBackend;
};

function nowIso(): string {
  return new Date().toISOString();
}

function buildJob(body: WorkerRunBody, traceId: string): OrchestrationJobEnvelope<Record<string, unknown>> {
  const created = nowIso();
  return {
    jobId: `job.${Date.now()}`,
    idempotencyKey: body.idempotencyKey ?? `idem.${traceId}`,
    createdAtIso: created,
    updatedAtIso: created,
    status: "queued",
    attempt: 1,
    priority: body.priority ?? "normal",
    retryPolicy: {
      maxAttempts: 3,
      backoffMs: 500
    },
    payload: body.payload ?? { task: "smoke" }
  };
}

function canUseAwsQueue(): boolean {
  return Boolean(readSqsQueueUrl() && readAwsRegion());
}

function canUseDynamo(): boolean {
  return Boolean(readDynamoTable() && readAwsRegion());
}

function shouldAllowAwsFallback(): boolean {
  if (process.env.ALLOW_AWS_WORKER_FALLBACK === "true") {
    return true;
  }

  return process.env.VERCEL_ENV !== "production";
}

async function executeWorker(
  job: OrchestrationJobEnvelope<Record<string, unknown>>,
  body: WorkerRunBody,
  queue: SqsQueueAdapter<Record<string, unknown>> | InMemoryQueueAdapter<Record<string, unknown>>,
  dynamicStore: DynamoOrchestrationStateStore<Record<string, unknown>> | null,
  backend: WorkerBackend
): Promise<WorkerExecutionResult> {
  const enqueued = await queue.enqueue(job);
  if (dynamicStore) {
    await dynamicStore.upsert(enqueued);
  }

  const lease = await queue.leaseNext({
    workerId: "worker.local",
    leaseTtlMs: 15_000,
    nowIso: nowIso()
  });

  if (!lease.leased || !lease.job) {
    throw new Error(lease.reason ?? "unable_to_lease");
  }

  if ("markStarted" in queue && typeof queue.markStarted === "function") {
    queue.markStarted(lease.job.jobId, nowIso());
  }

  const lifecycle = await runWorkerLifecycle(lease.job, {
    workerId: "worker.local",
    startedAtIso: nowIso(),
    nowIso,
    execute: async () => {
      if (body.simulateFailure) {
        throw new Error("simulated_worker_failure");
      }
    }
  });

  let finalJob = lease.job;

  if (lifecycle.status === "succeeded") {
    if ("markSucceeded" in queue && typeof queue.markSucceeded === "function") {
      finalJob = queue.markSucceeded(lease.job.jobId, nowIso());
    } else {
      finalJob = { ...lease.job, status: "succeeded", updatedAtIso: nowIso() };
    }
  } else if (lifecycle.status === "failed") {
    if ("markFailed" in queue && typeof queue.markFailed === "function") {
      finalJob = queue.markFailed(lease.job.jobId, nowIso(), "worker_failure", lifecycle.reason ?? "unknown", true);
    } else {
      finalJob = {
        ...lease.job,
        status: "failed",
        updatedAtIso: nowIso(),
        lastErrorMessage: lifecycle.reason,
        lastErrorCode: "worker_failure"
      };
    }
  }

  if (dynamicStore) {
    await dynamicStore.upsert(finalJob);
  }

  return { enqueued, lease, lifecycle, finalJob, backend };
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || (role !== "admin" && role !== "teacher" && role !== "professional_development")) {
    return NextResponse.json(
      { error: "Facilitator/admin role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as WorkerRunBody;
  const enqueuedJob = buildJob(body, traceId);

  const preferredStore = canUseDynamo()
    ? new DynamoOrchestrationStateStore<Record<string, unknown>>(readDynamoTable() as string)
    : null;
  const preferredQueue = canUseAwsQueue()
    ? new SqsQueueAdapter<Record<string, unknown>>(readSqsQueueUrl() as string)
    : new InMemoryQueueAdapter<Record<string, unknown>>();
  const preferredBackend: WorkerBackend = {
    queue: canUseAwsQueue() ? "sqs" : "in_memory",
    stateStore: preferredStore ? "dynamodb" : "none"
  };

  try {
    const result = await executeWorker(enqueuedJob, body, preferredQueue, preferredStore, preferredBackend);
    return NextResponse.json(result, { status: 200, headers: { [TRACE_HEADER]: traceId } });
  } catch (error) {
    const hasAwsPreferred = preferredBackend.queue === "sqs" || preferredBackend.stateStore === "dynamodb";
    if (!hasAwsPreferred) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "worker_execution_failed" },
        { status: 500, headers: { [TRACE_HEADER]: traceId } }
      );
    }

    if (!shouldAllowAwsFallback()) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "aws_backend_failure",
          backend: preferredBackend,
          fallbackBlocked: true
        },
        { status: 502, headers: { [TRACE_HEADER]: traceId } }
      );
    }

    const fallbackBackend: WorkerBackend = {
      queue: "in_memory",
      stateStore: "none",
      fallbackReason: error instanceof Error ? error.message : "aws_backend_failure"
    };

    const fallbackResult = await executeWorker(
      enqueuedJob,
      body,
      new InMemoryQueueAdapter<Record<string, unknown>>(),
      null,
      fallbackBackend
    );

    return NextResponse.json(fallbackResult, { status: 200, headers: { [TRACE_HEADER]: traceId } });
  }
}
