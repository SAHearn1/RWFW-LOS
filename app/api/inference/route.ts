import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export async function POST(): Promise<Response> {
  const traceId = createTraceId();

  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA !== "true") {
    return NextResponse.json(
      { error: "Local inference is disabled by feature flag." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { ok: true, route: "inference" },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
