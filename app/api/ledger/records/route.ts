import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { LEARNER_ROLES, FACILITATOR_ROLES } from "@/lib/auth/routeAccess";
import type { LedgerRecord } from "@/lib/ledger/adapter";
import { getServerLedgerAdapter } from "@/lib/ledger/server-adapter";
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
  if (
    typeof record.id !== "string" ||
    typeof record.missionId !== "string" ||
    typeof record.learnerId !== "string" ||
    typeof record.createdAtIso !== "string" ||
    typeof record.updatedAtIso !== "string" ||
    !record.payload || typeof record.payload !== "object"
  ) {
    return false;
  }

  // Validate type field and that payload shape is at least partially consistent.
  if (record.type === "mission") {
    const p = record.payload as Record<string, unknown>;
    return typeof p.id === "string" && typeof p.learnerId === "string";
  }

  if (record.type === "artifact") {
    const p = record.payload as Record<string, unknown>;
    return typeof p.id === "string" && typeof p.missionId === "string";
  }

  if (record.type === "verification") {
    const p = record.payload as Record<string, unknown>;
    return typeof p.id === "string" && typeof p.missionId === "string" && Array.isArray(p.standards);
  }

  return false;
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const ledger = getServerLedgerAdapter();
  if (!ledger.available) {
    return withTrace(503, traceId, { error: ledger.reason });
  }

  const requestedLearnerId = new URL(request.url).searchParams.get("learnerId")?.trim();
  let effectiveLearnerId: string | null = null;

  if ((LEARNER_ROLES as readonly string[]).includes(role)) {
    if (requestedLearnerId && requestedLearnerId !== user.id) {
      return withTrace(403, traceId, { error: "Learners can only access their own records." });
    }
    effectiveLearnerId = user.id;
  } else if ((FACILITATOR_ROLES as readonly string[]).includes(role)) {
    if (!requestedLearnerId) {
      return withTrace(400, traceId, { error: "learnerId is required for facilitator ledger reads." });
    }
    effectiveLearnerId = requestedLearnerId;
  } else if (role === "admin") {
    effectiveLearnerId = requestedLearnerId ?? null;
  } else {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const allRecords = await ledger.adapter.readAll();
  const records = effectiveLearnerId
    ? allRecords.filter((record) => record.learnerId === effectiveLearnerId)
    : allRecords;

  return withTrace(200, traceId, {
    records,
    total: records.length,
    learnerId: effectiveLearnerId
  });
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const ledger = getServerLedgerAdapter();
  if (!ledger.available) {
    return withTrace(503, traceId, { error: ledger.reason });
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

  if ((LEARNER_ROLES as readonly string[]).includes(role) && payload.learnerId !== user.id) {
    return withTrace(403, traceId, { error: "Learners can only write their own records." });
  }

  const allowedWriter = (LEARNER_ROLES as readonly string[]).includes(role) || (FACILITATOR_ROLES as readonly string[]).includes(role) || role === "admin";
  if (!allowedWriter) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const stored = await ledger.adapter.upsert(payload);
  return withTrace(200, traceId, { record: stored });
}
