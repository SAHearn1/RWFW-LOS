import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { purgeLedgerRecordsBefore } from "@/lib/ledger/adapter";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { purgeRuntimeStateBefore } from "@/lib/runtime/engine/store";

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const role = await getCurrentAppRole();
  if (role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: admin role required" },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const body = (await request.json()) as { cutoffIso?: string };

  if (!body.cutoffIso || typeof body.cutoffIso !== "string" || body.cutoffIso.trim() === "") {
    return NextResponse.json(
      { error: "cutoffIso is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const cutoffIso = body.cutoffIso.trim();
  const nowIso = new Date().toISOString();

  purgeLedgerRecordsBefore(cutoffIso);
  purgeRuntimeStateBefore(cutoffIso);

  recordAuditEvent({
    traceId,
    eventType: "data.retention.purge",
    role,
    actorId: userId,
    severity: "info",
    createdAtIso: nowIso,
    metadata: { cutoffIso }
  });

  return NextResponse.json(
    { purged: true, cutoffIso },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
