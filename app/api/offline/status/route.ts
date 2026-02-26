import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export function GET(): Response {
  const traceId = createTraceId();
  const timestamp = new Date().toISOString();

  if (process.env.NEXT_PUBLIC_ENABLE_OFFLINE !== "true") {
    return NextResponse.json(
      { status: "disabled", offline: false, timestampIso: timestamp },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  // GAP-14: Offline mode contract not yet implemented.
  // Flag is on but no service worker or offline ledger sync exists.
  return NextResponse.json(
    { status: "stub", offline: false, message: "Offline mode not yet implemented", timestampIso: timestamp },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
