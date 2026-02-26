import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export function GET(): Response {
  const traceId = createTraceId();

  return NextResponse.json(
    { ok: true, route: "ai/health", timestampIso: new Date().toISOString() },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
