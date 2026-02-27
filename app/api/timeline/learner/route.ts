import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { buildLearnerTimeline } from "@/lib/timeline/learnerTimeline";
import { createDbLedgerAdapter, getDbLedgerAvailability } from "@/lib/ledger/dbAdapter";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { shouldUseDbLedger } from "@/lib/ledger/flags";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  let records;
  if (shouldUseDbLedger()) {
    const availability = getDbLedgerAvailability();
    if (!availability.enabled) {
      return NextResponse.json(
        { error: availability.reason ?? "DB ledger unavailable" },
        { status: 503, headers: { [TRACE_HEADER]: traceId } }
      );
    }
    const adapter = createDbLedgerAdapter(availability.databasePath);
    records = adapter.readAll().filter((r) => r.learnerId === userId);
  } else {
    records = localLedgerAdapter.readAll().filter((r) => r.learnerId === userId);
  }

  const timeline = buildLearnerTimeline(records);

  return NextResponse.json(
    { timeline, learnerId: userId, total: timeline.length },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
