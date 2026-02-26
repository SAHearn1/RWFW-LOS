import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export function GET(): Response {
  const traceId = createTraceId();

  if (process.env.NEXT_PUBLIC_ENABLE_MCP !== "true") {
    return NextResponse.json(
      { ok: false, route: "mcp/health", reason: "MCP is disabled by feature flag." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { ok: true, route: "mcp/health", timestampIso: new Date().toISOString() },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
