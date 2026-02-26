import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export async function POST(): Promise<Response> {
  const traceId = createTraceId();

  return NextResponse.json(
    { ok: true, route: "admin/data-retention/purge" },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
