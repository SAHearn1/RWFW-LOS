import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createSupportDiagnosticsBundle } from "@/lib/support/diagnostics";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { [TRACE_HEADER]: traceId } });
  }

  const diagnostics = createSupportDiagnosticsBundle();

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      [TRACE_HEADER]: traceId,
      "cache-control": "no-store"
    }
  });
}
