import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import type { OrchestrationJobEnvelope } from "@/lib/orchestration/contracts";
import { InMemoryQueueAdapter } from "@/lib/orchestration/queueAdapter";
import { runWorkerLifecycle } from "@/lib/orchestration/workerRunner";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

type WorkerRunBody = {
  idempotencyKey?: string;
  priority?: "low" | "normal" | "high";
  payload?: Record<string, unknown>;
  simulateFailure?: boolean;
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
  const queue = new InMemoryQueueAdapter<Record<string, unknown>>();
  const enqueued = queue.enqueue(buildJob(body, traceId));

  const lease = queue.leaseNext({
    workerId: "worker.local",
    leaseTtlMs: 15_000,
    nowIso: nowIso()
  });

  if (!lease.leased || !lease.job) {
    return NextResponse.json(
      { error: lease.reason ?? "unable_to_lease" },
      { status: 409, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  queue.markStarted(lease.job.jobId, nowIso());

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

  if (lifecycle.status === "succeeded") {
    queue.markSucceeded(lease.job.jobId, nowIso());
  } else if (lifecycle.status === "failed") {
    queue.markFailed(lease.job.jobId, nowIso(), "worker_failure", lifecycle.reason ?? "unknown", true);
  }

  return NextResponse.json(
    {
      enqueued,
      lease,
      lifecycle,
      snapshot: queue.snapshot()
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
