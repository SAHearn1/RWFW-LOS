import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { purgeLedgerRecordsBefore } from "@/lib/ledger/adapter";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { purgeRuntimeStateBefore } from "@/lib/runtime/engine/store";

// NOTE: purgeLedgerRecordsBefore and purgeRuntimeStateBefore use
// localStorage-backed storage. On the server side (window === undefined) they
// fall back to the module-level in-memory store. This means the server-side
// call operates on the server's in-memory fallback, not a client's
// localStorage. Full server-side persistence requires wiring the DB adapter
// (GAP-11). This is acceptable for now and intentional per issue #93.

type PurgeBody = {
  cutoffIso?: string;
};

function isValidIso(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

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

  const body = (await request.json().catch(() => ({}))) as PurgeBody;
  const { cutoffIso } = body;

  if (!cutoffIso || typeof cutoffIso !== "string" || !isValidIso(cutoffIso)) {
    return NextResponse.json(
      { error: "cutoffIso must be a valid ISO 8601 date string." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const ledgerPurged = purgeLedgerRecordsBefore(cutoffIso);
  purgeRuntimeStateBefore(cutoffIso);

  recordAuditEvent({
    traceId,
    eventType: "admin.data.purge_executed",
    role: role,
    actorId: user?.id,
    severity: "warning",
    metadata: { cutoffIso, ledgerPurged },
    createdAtIso: new Date().toISOString()
  });

  return NextResponse.json(
    { cutoffIso, ledgerPurged, traceId },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
