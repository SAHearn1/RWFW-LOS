import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export function GET(): Response {
  const traceId = createTraceId();

  return NextResponse.json(
    { ok: true, route: "missions", missions: [] },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}

export async function POST(): Promise<Response> {
  const traceId = createTraceId();

  return NextResponse.json(
    { ok: true, route: "missions" },
    { status: 201, headers: { [TRACE_HEADER]: traceId } }
  );
}
