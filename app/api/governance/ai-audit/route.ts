/**
 * GET /api/governance/ai-audit
 *
 * Returns AI inference audit data from the AI Governance & Model Integrity Agent.
 * Restricted to admin and super_admin roles.
 *
 * Query params:
 *   mode - "summary" (default) | "events"
 *     summary: InferenceAuditSummary with aggregated stats
 *     events:  { events: InferenceAuditEvent[], total: number }
 *
 * Response: InferenceAuditSummary or events array from lib/llm/inferenceAudit.ts
 */
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { authorize } from "@/lib/auth/authorize";
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "@/lib/auth/routeAccess";
import {
  getInferenceAuditSummary,
  getRecentInferenceEvents
} from "@/lib/llm/inferenceAudit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";

const ALLOWED_ROLES = [...ADMIN_ROLE, ...SUPER_ADMIN_ROLE] as const;

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();

  const authResult = authorize(user, ALLOWED_ROLES, {
    traceId,
    route: "/api/governance/ai-audit"
  });
  if (!authResult.ok) return authResult.response;

  const rateLimitResponse = enforceRateLimit(
    authResult.userId,
    "/api/governance/ai-audit",
    RATE_LIMITS.read,
    traceId
  );
  if (rateLimitResponse) return rateLimitResponse;

  const mode = new URL(request.url).searchParams.get("mode") ?? "summary";

  if (mode === "events") {
    const events = getRecentInferenceEvents();
    return NextResponse.json(
      { events, total: events.length },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const summary = getInferenceAuditSummary();
  return NextResponse.json(summary, {
    status: 200,
    headers: { [TRACE_HEADER]: traceId }
  });
}
