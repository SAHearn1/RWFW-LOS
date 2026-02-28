import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { LEARNER_ROLES, FACILITATOR_ROLES } from "@/lib/auth/routeAccess";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { getRuntimeStateAdapter } from "@/lib/runtime/dynamoAdapter";
import type { RuntimeState } from "@/lib/runtime/engine/reducer";

export const runtime = "nodejs";

// Derived from canonical routeAccess constants for O(1) membership checks.
const LEARNER_ROLE_SET = new Set<string>(LEARNER_ROLES);
const FACILITATOR_ROLE_SET = new Set<string>(FACILITATOR_ROLES);

function withTrace(status: number, traceId: string, body: unknown): Response {
  return NextResponse.json(body, { status, headers: { [TRACE_HEADER]: traceId } });
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const adapterResult = getRuntimeStateAdapter();
  if (!adapterResult.available) {
    return withTrace(503, traceId, { error: adapterResult.reason });
  }

  const requestedLearnerId = new URL(request.url).searchParams.get("learnerId")?.trim();
  let learnerId: string;

  if (LEARNER_ROLE_SET.has(role)) {
    if (requestedLearnerId && requestedLearnerId !== user.id) {
      return withTrace(403, traceId, { error: "Learners can only access their own state." });
    }
    learnerId = user.id;
  } else if (FACILITATOR_ROLE_SET.has(role) || role === "admin" || role === "super_admin") {
    if (!requestedLearnerId) {
      return withTrace(400, traceId, { error: "learnerId is required." });
    }
    learnerId = requestedLearnerId;
  } else {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const state = await adapterResult.adapter.read(learnerId);
  return withTrace(200, traceId, { learnerId, state });
}

export async function PUT(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const adapterResult = getRuntimeStateAdapter();
  if (!adapterResult.available) {
    return withTrace(503, traceId, { error: adapterResult.reason });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withTrace(400, traceId, { error: "Invalid JSON body." });
  }

  if (!body || typeof body !== "object") {
    return withTrace(400, traceId, { error: "Request body must be an object." });
  }

  const { learnerId, state } = body as { learnerId?: unknown; state?: unknown };

  if (typeof learnerId !== "string" || !learnerId.trim()) {
    return withTrace(400, traceId, { error: "learnerId is required." });
  }

  if (!state || typeof state !== "object") {
    return withTrace(400, traceId, { error: "state is required." });
  }

  if (LEARNER_ROLE_SET.has(role) && learnerId !== user.id) {
    return withTrace(403, traceId, { error: "Learners can only write their own state." });
  }

  const allowed =
    LEARNER_ROLE_SET.has(role) ||
    FACILITATOR_ROLE_SET.has(role) ||
    role === "admin" ||
    role === "super_admin";

  if (!allowed) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  await adapterResult.adapter.write(learnerId, state as RuntimeState);
  return withTrace(200, traceId, { learnerId, saved: true });
}
