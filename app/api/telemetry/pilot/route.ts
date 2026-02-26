import { NextResponse } from "next/server";

import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const timestamp = new Date().toISOString();

  let body: { event?: string; properties?: Record<string, unknown> };
  try {
    body = (await request.json()) as { event?: string; properties?: Record<string, unknown> };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!body.event || typeof body.event !== "string") {
    return NextResponse.json(
      { error: "event field is required and must be a string" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  // Log as structured JSON — captured by Vercel Log Drains in production.
  console.log(
    JSON.stringify({
      source: "telemetry.pilot",
      traceId,
      event: body.event,
      properties: body.properties ?? {},
      timestampIso: timestamp
    })
  );

  return NextResponse.json(
    { accepted: true },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
