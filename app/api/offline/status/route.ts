import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export function GET(): Response {
  const traceId = createTraceId();

  if (process.env.NEXT_PUBLIC_ENABLE_OFFLINE !== "true") {
    return NextResponse.json(
      { ok: false, route: "offline/status", reason: "Offline mode is disabled by feature flag." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { ok: true, route: "offline/status", timestampIso: new Date().toISOString() },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
