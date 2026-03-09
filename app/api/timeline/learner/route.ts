import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { parseAppRole } from "@/lib/auth/userRole";
import { createDbLedgerAdapter, isDbLedgerAvailable } from "@/lib/ledger/dbAdapter";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { buildLearnerTimeline } from "@/lib/timeline/learnerTimeline";

const LEARNER_ROLES = new Set(["student_independent", "student_enrolled", "adult_learner"]);

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !LEARNER_ROLES.has(role)) {
    return NextResponse.json(
      { error: "Learner role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!user?.id) {
    return NextResponse.json(
      { error: "Authenticated session required." },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  let records;
  try {
    records = isDbLedgerAvailable()
      ? createDbLedgerAdapter().findByLearner(user.id)
      : localLedgerAdapter.findByLearner(user.id);
  } catch (error) {
    console.error("[timeline/learner] ledger_init_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Ledger unavailable." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const timeline = buildLearnerTimeline(records, user.id);

  return NextResponse.json(
    {
      timeline,
      total: timeline.length
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
