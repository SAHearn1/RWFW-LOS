import { appendFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export type AuditSeverity = "info" | "warning" | "error";

export type AuditEvent = {
  traceId: string;
  eventType: string;
  role: string;
  orgId?: string;
  actorId?: string;
  severity: AuditSeverity;
  metadata?: Record<string, unknown>;
  createdAtIso: string;
};

const AUDIT_LOG_PATH = resolve("docs", "status", "audit-log.ndjson");

async function appendAuditEventToFile(event: AuditEvent): Promise<void> {
  const directory = resolve("docs", "status");
  await mkdir(directory, { recursive: true });
  await appendFile(AUDIT_LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");
}

export function recordAuditEvent(event: AuditEvent): void {
  // Serverless-safe default sink: stdout/collector.
  console.log(`[audit] ${JSON.stringify(event)}`);

  if (process.env.AUDIT_LOG_TO_FILE !== "true") {
    return;
  }

  void appendAuditEventToFile(event).catch((error) => {
    console.warn(`[audit] file_sink_failed ${error instanceof Error ? error.message : "unknown_error"}`);
  });
}
