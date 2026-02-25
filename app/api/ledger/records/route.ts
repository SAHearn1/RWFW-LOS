import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import type { LedgerRecord } from "@/lib/ledger/adapter";
import { createDbLedgerAdapter, shouldUseDbLedger } from "@/lib/ledger/dbAdapter";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

function withTrace(status: number, traceId: string, body: unknown): Response {
  return NextResponse.json(body, { status, headers: { [TRACE_HEADER]: traceId } });
}

function isLedgerRecord(value: unknown): value is LedgerRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<LedgerRecord>;
  return Boolean(
    typeof record.id === "string" &&
    (record.type === "mission" || record.type === "artifact" || record.type === "verification") &&
    typeof record.missionId === "string" &&
    typeof record.learnerId === "string" &&
    typeof record.createdAtIso === "string" &&
    typeof record.updatedAtIso === "string" &&
    record.payload
  );
}

async function ensureRole(): Promise<string | null> {
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);
  return role;
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const role = await ensureRole();
  if (!role) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  if (!shouldUseDbLedger()) {
    return withTrace(503, traceId, { error: "DB ledger disabled via NEXT_PUBLIC_ENABLE_DB_LEDGER." });
  }

  const records = createDbLedgerAdapter().readAll();
  return withTrace(200, traceId, { records, total: records.length });
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const role = await ensureRole();
  if (!role) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  if (!shouldUseDbLedger()) {
    return withTrace(503, traceId, { error: "DB ledger disabled via NEXT_PUBLIC_ENABLE_DB_LEDGER." });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return withTrace(400, traceId, { error: "Invalid JSON body." });
  }

  if (!isLedgerRecord(payload)) {
    return withTrace(400, traceId, { error: "Invalid ledger record payload." });
  }

  const stored = createDbLedgerAdapter().upsert(payload);
  return withTrace(200, traceId, { record: stored });
}
