import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { createSupportDiagnosticsBundle } from "@/lib/support/diagnostics";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

// Diagnostics bundles include flag states and env var presence — restrict to privileged roles.
const DIAGNOSTICS_ALLOWED_ROLES = new Set(["admin", "super_admin"]);

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { [TRACE_HEADER]: traceId } });
  }

  const role = parseAppRole(user.publicMetadata?.role);
  if (!role || !DIAGNOSTICS_ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "admin or super_admin role required." }, { status: 403, headers: { [TRACE_HEADER]: traceId } });
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
