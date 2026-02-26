import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { deleteLedgerRecordsByLearner } from "@/lib/ledger/adapter";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { deleteRuntimeStateByLearner } from "@/lib/runtime/engine/store";

export async function DELETE(request: Request): Promise<Response> {
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

  const body = (await request.json()) as { learnerId?: string };

  if (!body.learnerId || typeof body.learnerId !== "string" || body.learnerId.trim() === "") {
    return NextResponse.json(
      { error: "learnerId is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const learnerId = body.learnerId.trim();
  const nowIso = new Date().toISOString();

  deleteLedgerRecordsByLearner(learnerId);
  deleteRuntimeStateByLearner(learnerId);

  recordAuditEvent({
    traceId,
    eventType: "data.retention.learner_deleted",
    role,
    actorId: userId,
    severity: "info",
    createdAtIso: nowIso,
    metadata: { learnerId }
  });

  return NextResponse.json(
    { deleted: true, learnerId },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
