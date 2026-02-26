import { appendFileSync } from "node:fs";

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

export function recordAuditEvent(event: AuditEvent): void {
  if (process.env.NODE_ENV === "production") {
    // In production (Vercel serverless), write to stdout as structured JSON
    // so Vercel Log Drains can capture the audit trail.
    console.log(JSON.stringify(event));
    return;
  }

  // In local development, append to /tmp to avoid project-directory write
  // failures and to keep audit entries across restarts of the dev server.
  try {
    appendFileSync("/tmp/rootwork-audit.ndjson", `${JSON.stringify(event)}\n`, "utf8");
  } catch {
    // Last-resort fallback: if /tmp write fails, echo to console so the event
    // is never silently dropped.
    console.log(JSON.stringify(event));
  }
}
