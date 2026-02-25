import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import type { LedgerRecord } from "@/lib/ledger/adapter";
import { createDbLedgerAdapter, getDbLedgerAvailability } from "@/lib/ledger/dbAdapter";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

function isLearnerRole(role: string): boolean {
  return role === "student_independent" || role === "student_enrolled" || role === "adult_learner";
}

function isFacilitatorRole(role: string): boolean {
  return role === "teacher" || role === "professional_development";
}

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

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const availability = getDbLedgerAvailability();
  if (!availability.enabled) {
    return withTrace(503, traceId, { error: availability.reason ?? "DB ledger unavailable." });
  }

  const requestedLearnerId = new URL(request.url).searchParams.get("learnerId")?.trim();
  let effectiveLearnerId: string | null = null;

  if (isLearnerRole(role)) {
    if (requestedLearnerId && requestedLearnerId !== user.id) {
      return withTrace(403, traceId, { error: "Learners can only access their own records." });
    }
    effectiveLearnerId = user.id;
  } else if (isFacilitatorRole(role)) {
    if (!requestedLearnerId) {
      return withTrace(400, traceId, { error: "learnerId is required for facilitator ledger reads." });
    }
    effectiveLearnerId = requestedLearnerId;
  } else if (role === "admin") {
    effectiveLearnerId = requestedLearnerId ?? null;
  } else {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const adapter = createDbLedgerAdapter(availability.databasePath);
  const allRecords = adapter.readAll();
  const records = effectiveLearnerId ? allRecords.filter((record) => record.learnerId === effectiveLearnerId) : allRecords;

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

  const availability = getDbLedgerAvailability();
  if (!availability.enabled) {
    return withTrace(503, traceId, { error: availability.reason ?? "DB ledger unavailable." });
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

  if (isLearnerRole(role) && payload.learnerId !== user.id) {
    return withTrace(403, traceId, { error: "Learners can only write their own records." });
  }

  const allowedWriter = isLearnerRole(role) || isFacilitatorRole(role) || role === "admin";
  if (!allowedWriter) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const stored = createDbLedgerAdapter(availability.databasePath).upsert(payload);
  return withTrace(200, traceId, { record: stored });
}
