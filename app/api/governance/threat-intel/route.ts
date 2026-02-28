/**
 * GET /api/governance/threat-intel
 *
 * Returns the authorization anomaly index and risk profiles from the
 * Security & Threat Intelligence Agent.
 * Restricted to super_admin only.
 *
 * Query params:
 *   since - ISO timestamp to filter the window (default: last 24 h)
 *
 * Response: ThreatIntelReport from lib/governance/threatIntelligence.ts
 */
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { authorize } from "@/lib/auth/authorize";
import { SUPER_ADMIN_ROLE } from "@/lib/auth/routeAccess";
import { generateThreatIntelReport } from "@/lib/governance/threatIntelligence";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();

  const authResult = authorize(user, SUPER_ADMIN_ROLE, {
    traceId,
    route: "/api/governance/threat-intel"
  });
  if (!authResult.ok) return authResult.response;

  const rateLimitResponse = enforceRateLimit(
    authResult.userId,
    "/api/governance/threat-intel",
    RATE_LIMITS.read,
    traceId
  );
  if (rateLimitResponse) return rateLimitResponse;

  const sinceParam = new URL(request.url).searchParams.get("since") ?? undefined;
  const report = generateThreatIntelReport(sinceParam);

  return NextResponse.json(report, {
    status: 200,
    headers: { [TRACE_HEADER]: traceId }
  });
}
