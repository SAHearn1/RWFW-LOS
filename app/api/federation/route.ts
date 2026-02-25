import { NextResponse } from "next/server";

import { dispatchFederationTask } from "@/lib/federation/dispatch";
import { createFederationRequest, createFederationResponse } from "@/lib/federation/protocol";
import { getFederationDiscovery, resolveFederationAssignment } from "@/lib/federation/registry";
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

  if (!assignment.accepted || !assignment.assignedAgentId) {
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

  const dispatch = await dispatchFederationTask(body.task, assignment.assignedAgentId);

  const responseEnvelope = createFederationResponse({
    taskId: body.task.taskId,
    correlationId: body.task.correlationId,
    status: dispatch.status,
    ...(dispatch.status === "success"
      ? { output: dispatch.output }
      : { errorCode: dispatch.errorCode ?? "dispatch_failed", errorMessage: dispatch.errorMessage ?? "dispatch_failed" })
  });

  recordAuditEvent({
    traceId,
    eventType: dispatch.status === "success" ? "federation.request.dispatched" : "federation.request.dispatch_failed",
    role: body.task.requestedByRole,
    severity: dispatch.status === "success" ? "info" : "error",
    createdAtIso: new Date().toISOString(),
    metadata: {
      taskId: body.task.taskId,
      requestedAgentId: body.task.assignedAgentId,
      assignedAgentId: assignment.assignedAgentId,
      capabilityId: body.task.capabilityId,
      dispatchStatus: dispatch.status,
      dispatchError: dispatch.errorMessage
    }
  });

  return NextResponse.json(responseEnvelope, {
    status: dispatch.status === "success" ? 200 : 502,
    headers: { [TRACE_HEADER]: traceId }
  });
}
