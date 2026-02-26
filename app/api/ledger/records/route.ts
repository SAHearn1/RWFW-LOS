import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createDbLedgerAdapter, shouldUseDbLedger } from "@/lib/ledger/dbAdapter";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
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

  return NextResponse.json(
    { records },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
