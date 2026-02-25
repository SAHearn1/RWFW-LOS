import { NextResponse } from "next/server";

import { ingestPilotKpiEvent, isTelemetryTokenAuthorized } from "@/lib/observability/pilotTelemetry";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

function getBearerToken(request: Request): string | null {
  const raw = request.headers.get("authorization");
  if (!raw?.startsWith("Bearer ")) {
    return null;
  }

  return raw.slice("Bearer ".length).trim();
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  if (!isTelemetryTokenAuthorized(getBearerToken(request))) {
    return NextResponse.json(
      { error: "Unauthorized telemetry ingestion token." },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const body = (await request.json()) as { event?: unknown };
  if (!body?.event) {
    return NextResponse.json(
      { error: "event payload is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  try {
    const result = ingestPilotKpiEvent(body.event, traceId);
    return NextResponse.json(result, { status: 202, headers: { [TRACE_HEADER]: traceId } });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid telemetry payload"
      },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }
}
