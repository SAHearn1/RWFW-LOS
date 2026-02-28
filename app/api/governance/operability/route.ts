/**
 * GET /api/governance/operability
 *
 * Returns the multi-dimensional platform operability score.
 * Restricted to admin and super_admin roles.
 *
 * Response: OperabilityReport from lib/governance/operabilityScore.ts
 */
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { authorize } from "@/lib/auth/authorize";
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "@/lib/auth/routeAccess";
import {
  computeOperabilityScore,
  gatherOperabilitySignals
} from "@/lib/governance/operabilityScore";
import { generateThreatIntelReport } from "@/lib/governance/threatIntelligence";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";

const ALLOWED_ROLES = [...ADMIN_ROLE, ...SUPER_ADMIN_ROLE] as const;

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();

  const authResult = authorize(user, ALLOWED_ROLES, {
    traceId,
    route: "/api/governance/operability"
  });
  if (!authResult.ok) return authResult.response;

  const rateLimitResponse = enforceRateLimit(
    authResult.userId,
    "/api/governance/operability",
    RATE_LIMITS.read,
    traceId
  );
  if (rateLimitResponse) return rateLimitResponse;

  const sinceParam = new URL(request.url).searchParams.get("since") ?? undefined;

  // Feed threat intelligence anomaly count into operability signals
  const threatReport = generateThreatIntelReport(sinceParam);
  const signals = gatherOperabilitySignals(threatReport.authorizationAnomalyIndex);
  const report = computeOperabilityScore(signals);

  return NextResponse.json(report, {
    status: 200,
    headers: { [TRACE_HEADER]: traceId }
  });
}
