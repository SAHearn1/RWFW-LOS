import { appendFileSync, existsSync, mkdirSync } from "node:fs";
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

export function recordAuditEvent(event: AuditEvent): void {
  const directory = resolve("docs", "status");
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  appendFileSync(AUDIT_LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");
}
