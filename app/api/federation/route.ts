import { NextResponse } from "next/server";

import { createFederationRequest, createFederationResponse } from "@/lib/federation/protocol";
import { getFederationDiscovery, resolveFederationAssignment } from "@/lib/federation/registry";
import { dispatchFederationTask } from "@/lib/federation/taskDispatch";
import { storeFederationResult, getFederationResult } from "@/lib/federation/taskStore";
import type { FederationTaskEnvelope } from "@/lib/federation/types";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

function ensureFederationEnabled(traceId: string): Response | null {
  if (process.env.NEXT_PUBLIC_ENABLE_FEDERATION !== "true") {
    recordAuditEvent({
      traceId,
      eventType: "federation.request.blocked",
      role: "unknown",
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { reason: "feature_disabled" }
    });

    return NextResponse.json(
      { error: "Federation is disabled by feature flag." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return null;
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const blocked = ensureFederationEnabled(traceId);
  if (blocked) {
    return blocked;
  }

  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId");
  if (taskId) {
    const result = getFederationResult(taskId);
    if (!result) {
      return NextResponse.json({ error: "task_not_found" }, { status: 404, headers: { [TRACE_HEADER]: traceId } });
    }
    return NextResponse.json(result, { status: 200, headers: { [TRACE_HEADER]: traceId } });
  }

  const discovery = getFederationDiscovery();
  return NextResponse.json(
    {
      protocol: "v1",
      discovery
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const blocked = ensureFederationEnabled(traceId);
  if (blocked) {
    return blocked;
  }

  const body = (await request.json()) as { task?: FederationTaskEnvelope };
  if (!body.task) {
    return NextResponse.json({ error: "task payload is required" }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const requestEnvelope = createFederationRequest(body.task);
  const assignment = resolveFederationAssignment(body.task);

  if (!assignment.accepted) {
    recordAuditEvent({
      traceId,
      eventType: "federation.request.rejected",
      role: body.task.requestedByRole,
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: {
        taskId: body.task.taskId,
        capabilityId: body.task.capabilityId,
        reason: assignment.reason
      }
    });

    return NextResponse.json(
      {
        error: assignment.reason ?? "capability_not_found",
        protocol: requestEnvelope.version
      },
      { status: 404, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const taskResult = dispatchFederationTask(body.task, assignment.assignedAgentId!);
  storeFederationResult(taskResult);

  const responseEnvelope = createFederationResponse({
    taskId: body.task.taskId,
    correlationId: body.task.correlationId,
    status: "success",
    output: {
      accepted: true,
      protocol: requestEnvelope.version,
      assignedAgentId: assignment.assignedAgentId,
      ...taskResult.output
    }
  });

  recordAuditEvent({
    traceId,
    eventType: "federation.request.accepted",
    role: body.task.requestedByRole,
    severity: "info",
    createdAtIso: new Date().toISOString(),
    metadata: {
      taskId: body.task.taskId,
      requestedAgentId: body.task.assignedAgentId,
      assignedAgentId: assignment.assignedAgentId,
      capabilityId: body.task.capabilityId
    }
  });

  return NextResponse.json(responseEnvelope, { status: 200, headers: { [TRACE_HEADER]: traceId } });
}
