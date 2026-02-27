import { NextResponse } from "next/server";

import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { recordAuditEvent } from "@/lib/observability/audit";

export const runtime = "nodejs";

type TelemetryEvent = {
  eventType: string;
  role?: string;
  orgId?: string;
  actorId?: string;
  severity?: "info" | "warning" | "error";
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const timestamp = new Date().toISOString();

  const ingestToken = process.env.ROOTWORK_TELEMETRY_INGEST_TOKEN?.trim();
  const authHeader = request.headers.get("authorization")?.trim();

  if (ingestToken) {
    if (!authHeader || authHeader !== `Bearer ${ingestToken}`) {
      return NextResponse.json(
        { error: "Invalid or missing telemetry ingest token." },
        { status: 401, headers: { [TRACE_HEADER]: traceId } }
      );
    }
  }

  let body: TelemetryEvent;
  try {
    body = (await request.json()) as TelemetryEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!body.eventType || typeof body.eventType !== "string") {
    return NextResponse.json(
      { error: "eventType is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  recordAuditEvent({
    traceId,
    eventType: `telemetry.${body.eventType}`,
    role: body.role ?? "unknown",
    orgId: body.orgId,
    actorId: body.actorId,
    severity: body.severity ?? "info",
    metadata: body.metadata,
    createdAtIso: timestamp
  });

  return NextResponse.json(
    { accepted: true, traceId, timestampIso: timestamp },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
