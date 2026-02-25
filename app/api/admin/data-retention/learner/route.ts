import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { deleteLedgerRecordsByLearner } from "@/lib/ledger/adapter";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { deleteRuntimeStateByLearner } from "@/lib/runtime/engine/store";

// NOTE: deleteLedgerRecordsByLearner and deleteRuntimeStateByLearner use
// localStorage-backed storage. On the server side (window === undefined) they
// fall back to the module-level in-memory store. This means the server-side
// call operates on the server's in-memory fallback, not a client's
// localStorage. Full server-side persistence requires wiring the DB adapter
// (GAP-11). This is acceptable for now and intentional per issue #93.

type LearnerDeleteBody = {
  learnerId?: string;
};

export async function DELETE(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Admin role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as LearnerDeleteBody;
  const { learnerId } = body;

  if (!learnerId || typeof learnerId !== "string" || learnerId.trim() === "") {
    return NextResponse.json(
      { error: "learnerId is required." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const ledgerDeleted = deleteLedgerRecordsByLearner(learnerId);
  deleteRuntimeStateByLearner(learnerId);

  recordAuditEvent({
    traceId,
    eventType: "admin.data.learner_deleted",
    role: role,
    actorId: user?.id,
    severity: "warning",
    metadata: { learnerId, ledgerDeleted },
    createdAtIso: new Date().toISOString()
  });

  return NextResponse.json(
    { learnerId, ledgerDeleted, runtimeCleared: true, traceId },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
