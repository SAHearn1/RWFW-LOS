import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { localLedgerAdapter, type LedgerRecord } from "@/lib/ledger/adapter";
import { createDbLedgerAdapter, shouldUseDbLedger } from "@/lib/ledger/dbAdapter";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

const FACILITATOR_AND_ADMIN_ROLES = new Set([
  "teacher",
  "professional_development",
  "admin",
]);

type ReviewItem = {
  id: string;
  missionId: string;
  learnerId: string;
  artifactPreview: string;
  submittedAtIso: string;
  verdict: "pending" | "approved" | "returned" | "flagged";
};

type ReviewPayload = Record<string, unknown>;

// GET /api/reviews
// Returns review items built from artifact + verification ledger records.
export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const role = await getCurrentAppRole();
  if (!FACILITATOR_AND_ADMIN_ROLES.has(role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  try {
    const adapter = shouldUseDbLedger() ? createDbLedgerAdapter() : localLedgerAdapter;
    const allRecords = adapter.readAll();

    const artifactRecords = allRecords.filter((r) => r.type === "artifact");
    const verificationRecords = allRecords.filter((r) => r.type === "verification");

    // Build a map from missionId → most recent verification record
    const verificationByMission = new Map<string, LedgerRecord>();
    for (const vr of verificationRecords) {
      const existing = verificationByMission.get(vr.missionId);
      if (!existing || vr.createdAtIso > existing.createdAtIso) {
        verificationByMission.set(vr.missionId, vr);
      }
    }

    const items: ReviewItem[] = artifactRecords.map((ar) => {
      const artifactPayload = ar.payload as ReviewPayload;
      const rawContent =
        typeof artifactPayload["content"] === "string"
          ? artifactPayload["content"]
          : "";
      const artifactPreview = rawContent.slice(0, 200);

      const verRecord = verificationByMission.get(ar.missionId);
      let verdict: ReviewItem["verdict"] = "pending";
      if (verRecord) {
        const verPayload = verRecord.payload as ReviewPayload;
        const payloadVerdict = verPayload["verdict"];
        if (
          payloadVerdict === "approved" ||
          payloadVerdict === "returned" ||
          payloadVerdict === "flagged"
        ) {
          verdict = payloadVerdict;
        }
      }

      return {
        id: ar.id,
        missionId: ar.missionId,
        learnerId: ar.learnerId,
        artifactPreview,
        submittedAtIso: ar.createdAtIso,
        verdict,
      };
    });

    // Sort descending by submittedAtIso, cap at 50
    items.sort((a, b) => b.submittedAtIso.localeCompare(a.submittedAtIso));
    const limited = items.slice(0, 50);

    return NextResponse.json(
      { items: limited },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { [TRACE_HEADER]: traceId } }
    );
  }
}

// POST /api/reviews
// Records a reviewer verdict as a verification LedgerRecord.
export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const role = await getCurrentAppRole();
  if (!FACILITATOR_AND_ADMIN_ROLES.has(role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body) ||
    !("verdict" in body)
  ) {
    return NextResponse.json(
      { error: "id and verdict are required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const { id, verdict, note } = body as {
    id: unknown;
    verdict: unknown;
    note?: unknown;
  };

  if (typeof id !== "string" || id.trim() === "") {
    return NextResponse.json(
      { error: "id must be a non-empty string" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (verdict !== "approved" && verdict !== "returned" && verdict !== "flagged") {
    return NextResponse.json(
      { error: "verdict must be one of: approved, returned, flagged" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  try {
    const adapter = shouldUseDbLedger() ? createDbLedgerAdapter() : localLedgerAdapter;
    const allRecords = adapter.readAll();

    // Find the artifact record to get missionId and learnerId
    const artifactRecord = allRecords.find((r) => r.id === id && r.type === "artifact");
    if (!artifactRecord) {
      return NextResponse.json(
        { error: "Artifact record not found" },
        { status: 400, headers: { [TRACE_HEADER]: traceId } }
      );
    }

    const nowIso = new Date().toISOString();
    const verificationId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    const verificationRecord: LedgerRecord = {
      id: verificationId,
      type: "verification",
      missionId: artifactRecord.missionId,
      learnerId: artifactRecord.learnerId,
      payload: {
        verdict,
        note: typeof note === "string" ? note : undefined,
        reviewerId: userId,
        reviewedAtIso: nowIso,
        artifactId: id,
      },
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    adapter.upsert(verificationRecord);

    return NextResponse.json(
      { ok: true, id: verificationId },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { [TRACE_HEADER]: traceId } }
    );
  }
}
