import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { dispatchFederationTask } from "@/lib/federation/dispatch";
import { createFederationRequest, createFederationResponse } from "@/lib/federation/protocol";
import { getFederationDiscovery, resolveFederationAssignment } from "@/lib/federation/registry";
import type { FederationTaskEnvelope } from "@/lib/federation/types";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Roles allowed to dispatch federation tasks (privileged operation).
const FEDERATION_DISPATCH_ROLES = new Set(["admin", "super_admin"]);

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

function isValidTaskEnvelope(value: unknown): value is FederationTaskEnvelope {
  if (!value || typeof value !== "object") return false;
  const t = value as Partial<FederationTaskEnvelope>;
  return (
    typeof t.taskId === "string" && t.taskId.length > 0 &&
    typeof t.correlationId === "string" && t.correlationId.length > 0 &&
    typeof t.requestedByRole === "string" &&
    typeof t.assignedAgentId === "string" &&
    typeof t.capabilityId === "string" && t.capabilityId.length > 0 &&
    typeof t.payload === "object" && t.payload !== null
  );
}

// GET /api/federation — discovery endpoint (requires authenticated user).
export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const blocked = ensureFederationEnabled(traceId);
  if (blocked) return blocked;

  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const discovery = getFederationDiscovery();
  return NextResponse.json(
    { protocol: "v1", discovery },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}

// POST /api/federation — task dispatch (admin / super_admin only).
export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const blocked = ensureFederationEnabled(traceId);
  if (blocked) return blocked;

  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  const rateLimitResponse = enforceRateLimit(user?.id ?? "anonymous", "/api/federation", RATE_LIMITS.mutation, traceId);
  if (rateLimitResponse) return rateLimitResponse;

  if (!role || !FEDERATION_DISPATCH_ROLES.has(role)) {
    recordAuditEvent({
      traceId,
      eventType: "federation.request.unauthorized",
      role: role ?? "unauthenticated",
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { reason: "insufficient_role" }
    });
    return NextResponse.json(
      { error: "admin or super_admin role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  let body: { task?: unknown };
  try {
    body = (await request.json()) as { task?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!isValidTaskEnvelope(body.task)) {
    return NextResponse.json(
      { error: "task payload is missing or invalid. Required fields: taskId, correlationId, requestedByRole, assignedAgentId, capabilityId, payload." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const task = body.task;
  const requestEnvelope = createFederationRequest(task);
  const assignment = resolveFederationAssignment(task);

  if (!assignment.accepted || !assignment.assignedAgentId) {
    recordAuditEvent({
      traceId,
      eventType: "federation.request.rejected",
      role,
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: {
        taskId: task.taskId,
        capabilityId: task.capabilityId,
        reason: assignment.reason
      }
    });

    return NextResponse.json(
      { error: assignment.reason ?? "capability_not_found", protocol: requestEnvelope.version },
      { status: 404, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const dispatch = await dispatchFederationTask(task, assignment.assignedAgentId);

  const responseEnvelope = createFederationResponse({
    taskId: task.taskId,
    correlationId: task.correlationId,
    status: dispatch.status,
    ...(dispatch.status === "success"
      ? { output: dispatch.output }
      : { errorCode: dispatch.errorCode ?? "dispatch_failed", errorMessage: dispatch.errorMessage ?? "dispatch_failed" })
  });

  recordAuditEvent({
    traceId,
    eventType: dispatch.status === "success" ? "federation.request.dispatched" : "federation.request.dispatch_failed",
    role,
    actorId: user?.id,
    severity: dispatch.status === "success" ? "info" : "error",
    createdAtIso: new Date().toISOString(),
    metadata: {
      taskId: task.taskId,
      requestedAgentId: task.assignedAgentId,
      assignedAgentId: assignment.assignedAgentId,
      capabilityId: task.capabilityId,
      dispatchStatus: dispatch.status,
      dispatchError: dispatch.errorMessage
    }
  });

  return NextResponse.json(responseEnvelope, {
    status: dispatch.status === "success" ? 200 : 502,
    headers: { [TRACE_HEADER]: traceId }
  });
}
