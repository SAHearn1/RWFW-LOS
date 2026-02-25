import { NextResponse } from "next/server";

import { createFederationRequest, createFederationResponse } from "@/lib/federation/protocol";
import type { FederationTaskEnvelope } from "@/lib/federation/types";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

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

  const body = (await request.json()) as { task?: FederationTaskEnvelope };
  if (!body.task) {
    return NextResponse.json({ error: "task payload is required" }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const requestEnvelope = createFederationRequest(body.task);

  const responseEnvelope = createFederationResponse({
    taskId: body.task.taskId,
    correlationId: body.task.correlationId,
    status: "success",
    output: {
      accepted: true,
      protocol: requestEnvelope.version
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
      assignedAgentId: body.task.assignedAgentId,
      capabilityId: body.task.capabilityId
    }
  });

  return NextResponse.json(responseEnvelope, { status: 200, headers: { [TRACE_HEADER]: traceId } });
}
