import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export function GET(): Response {
  const traceId = createTraceId();

  return NextResponse.json(
    {
      status: "ok",
      service: "rwfw-los",
      timestampIso: new Date().toISOString()
    },
    {
      status: 200,
      headers: {
        [TRACE_HEADER]: traceId
      }
    }
  );
}
