import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import type { LedgerRecord } from "@/lib/ledger/adapter";
import { createDbLedgerAdapter, shouldUseDbLedger } from "@/lib/ledger/dbAdapter";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

type TimelineEvent = {
  type: "mission" | "artifact" | "verification";
  id: string;
  timestamp: string;
  summary: string;
};

function ledgerRecordToTimelineEvent(record: LedgerRecord): TimelineEvent {
  const timestamp = record.updatedAtIso;

  switch (record.type) {
    case "mission": {
      const mission = record.payload as { title?: string; stage?: string };
      return {
        type: "mission",
        id: record.id,
        timestamp,
        summary: `Mission "${mission.title ?? record.missionId}" — ${mission.stage ?? "unknown"}`
      };
    }
    case "artifact": {
      const artifact = record.payload as { content?: string };
      const preview = typeof artifact.content === "string" ? artifact.content.slice(0, 60) : "";
      return {
        type: "artifact",
        id: record.id,
        timestamp,
        summary: preview ? `Artifact saved: "${preview}${artifact.content && artifact.content.length > 60 ? "…" : ""}"` : "Artifact saved"
      };
    }
    case "verification": {
      const verification = record.payload as { verdict?: string; standards?: string[] };
      const standards = Array.isArray(verification.standards) ? verification.standards.join(", ") : "";
      return {
        type: "verification",
        id: record.id,
        timestamp,
        summary: `Verification ${verification.verdict ?? "unknown"}${standards ? ` (${standards})` : ""}`
      };
    }
    default:
      return { type: "mission", id: record.id, timestamp, summary: "Unknown event" };
  }
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  // The local ledger adapter reads from window.localStorage and is browser-only.
  // On the server, only the DB adapter has access to persisted ledger records.
  // When DB ledger is enabled, read from SQLite; otherwise return an empty timeline
  // (client-side data is not accessible from the server without a transfer mechanism).
  let events: TimelineEvent[] = [];

  if (shouldUseDbLedger()) {
    try {
      const adapter = createDbLedgerAdapter();
      const records = adapter.readAll();
      events = records
        .map(ledgerRecordToTimelineEvent)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch {
      // DB adapter failed — degrade gracefully with empty timeline.
      events = [];
    }
  }

  return NextResponse.json(
    { events },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
