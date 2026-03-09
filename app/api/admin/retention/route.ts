import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { deleteDbLedgerRecordsByLearner, getDbLedgerAvailability, purgeDbLedgerRecordsBefore } from "@/lib/ledger/dbAdapter";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";

type RetentionAction = "purge_before" | "delete_learner";

type RetentionBody = {
  action?: RetentionAction;
  cutoffIso?: string;
  learnerId?: string;
};

function isAdminOrSuperAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

function isValidIso(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !isAdminOrSuperAdmin(role)) {
    return NextResponse.json(
      { error: "Admin or super_admin role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const rateLimitResponse = enforceRateLimit(user?.id ?? "anonymous", "/api/admin/retention", RATE_LIMITS.mutation, traceId);
  if (rateLimitResponse) return rateLimitResponse;

  const availability = getDbLedgerAvailability();
  if (!availability.enabled) {
    return NextResponse.json(
      { error: availability.reason ?? "DB ledger unavailable." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  let body: RetentionBody;
  try {
    body = (await request.json()) as RetentionBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const { action } = body;

  if (action === "purge_before") {
    if (!isValidIso(body.cutoffIso)) {
      return NextResponse.json(
        { error: "cutoffIso must be a valid ISO date string." },
        { status: 400, headers: { [TRACE_HEADER]: traceId } }
      );
    }

    const purged = purgeDbLedgerRecordsBefore(body.cutoffIso, availability.databasePath);
    const doneAtIso = new Date().toISOString();

    recordAuditEvent({
      traceId,
      eventType: "admin.retention.purge_before",
      role,
      actorId: user?.id,
      severity: "info",
      createdAtIso: doneAtIso,
      metadata: { action, cutoffIso: body.cutoffIso, purged }
    });

    return NextResponse.json(
      { action, cutoffIso: body.cutoffIso, purged, doneAtIso },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (action === "delete_learner") {
    const { learnerId } = body;
    if (typeof learnerId !== "string" || learnerId.trim().length === 0) {
      return NextResponse.json(
        { error: "learnerId is required for delete_learner action." },
        { status: 400, headers: { [TRACE_HEADER]: traceId } }
      );
    }

    const purged = deleteDbLedgerRecordsByLearner(learnerId.trim(), availability.databasePath);
    const doneAtIso = new Date().toISOString();

    recordAuditEvent({
      traceId,
      eventType: "admin.retention.delete_learner",
      role,
      actorId: user?.id,
      severity: "info",
      createdAtIso: doneAtIso,
      metadata: { action, learnerId: learnerId.trim(), purged }
    });

    return NextResponse.json(
      { action, learnerId: learnerId.trim(), purged, doneAtIso },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { error: "action must be 'purge_before' or 'delete_learner'." },
    { status: 400, headers: { [TRACE_HEADER]: traceId } }
  );
}
