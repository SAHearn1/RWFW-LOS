import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { localLedgerAdapter, type DataTier } from "@/lib/ledger/adapter";
import { createDbLedgerAdapter, shouldUseDbLedger } from "@/lib/ledger/dbAdapter";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const adapter = shouldUseDbLedger() ? createDbLedgerAdapter() : localLedgerAdapter;
  const allRecords = adapter.readAll();
  const records = allRecords.filter((record) => record.learnerId === userId);

  // #244: Audit log on data access — emit per data tier accessed
  const tiersAccessed = new Set<DataTier>(
    records.map((r) => r.dataTier ?? "tier-1")
  );
  const highTierAccess = tiersAccessed.has("tier-3") || tiersAccessed.has("tier-2");

  recordAuditEvent({
    traceId,
    eventType: "ledger.read",
    role: "learner",
    actorId: userId,
    severity: highTierAccess ? "warning" : "info",
    createdAtIso: new Date().toISOString(),
    metadata: {
      recordCount: records.length,
      tiersAccessed: Array.from(tiersAccessed),
      resourceType: "ledger",
      action: "read",
    },
  });

  return NextResponse.json(
    { records },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
