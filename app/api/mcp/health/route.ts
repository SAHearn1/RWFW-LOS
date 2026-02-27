import { NextResponse } from "next/server";

import { phase1FeatureFlags } from "@/lib/config/featureFlags";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

export function GET(request: Request): Response {
  const traceId = getTraceIdFromRequest(request);

  if (!phase1FeatureFlags.enableMcp) {
    return NextResponse.json(
      { status: "disabled", reason: "NEXT_PUBLIC_ENABLE_MCP=false" },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { status: "ready", transport: "internal-placeholder" },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
