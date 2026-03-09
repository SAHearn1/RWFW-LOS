import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { phase1FeatureFlags } from "@/lib/config/featureFlags";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return NextResponse.json(
      { error: "Authenticated session required." },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!phase1FeatureFlags.enableMcp) {
    return NextResponse.json(
      { status: "disabled", reason: "NEXT_PUBLIC_ENABLE_MCP=false" },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { status: "ready", transport: "internal-placeholder" },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
