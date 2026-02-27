import { NextResponse } from "next/server";

import { phase1FeatureFlags } from "@/lib/config/featureFlags";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export function GET(request: Request): Response {
  const traceId = getTraceIdFromRequest(request);

  if (!phase1FeatureFlags.enableOffline) {
    return NextResponse.json(
      { status: "disabled", reason: "NEXT_PUBLIC_ENABLE_OFFLINE=false" },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { status: "ready", mode: "service-worker", swPath: "/sw.js" },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
