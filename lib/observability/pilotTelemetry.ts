import { appendFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { isPilotKpiEvent, type PilotKpiEvent } from "@/lib/observability/pilotKpiContracts";

const TELEMETRY_LOG_PATH = resolve("docs", "status", "pilot-kpi-events.ndjson");

function safeToken(value: string, fallback: string): string {
  const cleaned = value.trim();
  if (cleaned.length === 0 || cleaned.length > 128) {
    return fallback;
  }

  return cleaned;
}

function safeRoute(value: string): string {
  const cleaned = value.trim();
  if (!cleaned.startsWith("/") || cleaned.length > 120) {
    return "/unknown";
  }

  return cleaned;
}

function safeMissionId(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value.trim();
  if (!/^[a-zA-Z0-9._-]{1,64}$/.test(cleaned)) {
    return undefined;
  }

  return cleaned;
}

function sanitizeEvent(event: PilotKpiEvent, traceId: string): PilotKpiEvent {
  return {
    version: 1,
    eventId: safeToken(event.eventId, `event-${Date.now().toString(36)}`),
    traceId: safeToken(event.traceId, traceId),
    metricKey: event.metricKey,
    roleSegment: event.roleSegment,
    value: Number.isFinite(event.value) ? event.value : 0,
    createdAtIso: new Date(event.createdAtIso).toISOString(),
    context: {
      missionId: safeMissionId(event.context.missionId),
      // learnerId is intentionally dropped to preserve privacy boundary.
      route: safeRoute(event.context.route),
      source: event.context.source
    }
  };
}

async function persistTelemetryEvent(event: PilotKpiEvent): Promise<void> {
  if (process.env.VERCEL === "1") {
    console.log(`[pilot-kpi] ${JSON.stringify(event)}`);
    return;
  }

  await mkdir(resolve("docs", "status"), { recursive: true });
  await appendFile(TELEMETRY_LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");
}

export function isTelemetryTokenAuthorized(requestToken: string | null): boolean {
  const expected = process.env.ROOTWORK_TELEMETRY_INGEST_TOKEN?.trim();
  if (!expected) {
    return true;
  }

  return requestToken === expected;
}

export function ingestPilotKpiEvent(input: unknown, traceId: string): { accepted: true; eventId: string } {
  if (!isPilotKpiEvent(input)) {
    throw new Error("Invalid pilot KPI event payload.");
  }

  const event = sanitizeEvent(input, traceId);
  void persistTelemetryEvent(event).catch((error) => {
    console.warn(`[pilot-kpi] persist_failed ${error instanceof Error ? error.message : "unknown_error"}`);
  });

  return { accepted: true, eventId: event.eventId };
}
