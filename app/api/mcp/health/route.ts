import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export function GET(): Response {
  const traceId = createTraceId();
  const timestamp = new Date().toISOString();

  if (process.env.NEXT_PUBLIC_ENABLE_MCP !== "true") {
    return NextResponse.json(
      { status: "disabled", message: "MCP not enabled", timestampIso: timestamp },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  // GAP-13: MCP integration contract not yet implemented.
  // Flag is on but no implementation exists — return stub response.
  return NextResponse.json(
    { status: "stub", message: "MCP integration not yet implemented", timestampIso: timestamp },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
