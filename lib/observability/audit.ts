import { appendFileSync } from "node:fs";
import path from "node:path";

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

const auditLogPath =
  process.env.NODE_ENV === "development"
    ? path.join(process.cwd(), "docs", "status", "audit-log.ndjson")
    : "/tmp/rootwork-audit.ndjson";

export function recordAuditEvent(event: AuditEvent): void {
  console.log(JSON.stringify({ audit: true, ...event }));

  try {
    appendFileSync(auditLogPath, JSON.stringify(event) + "\n", "utf8");
  } catch (err) {
    console.error("[audit] write failed:", err);
  }
}
