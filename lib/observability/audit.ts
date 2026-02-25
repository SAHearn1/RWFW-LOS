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
const AUDIT_HTTP_TIMEOUT_MS = 1500;

function isServerlessRuntime(): boolean {
  return process.env.VERCEL === "1";
}

async function appendAuditEventToFile(event: AuditEvent): Promise<void> {
  const directory = resolve("docs", "status");
  await mkdir(directory, { recursive: true });
  await appendFile(AUDIT_LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");
}

async function sendAuditEventToHttp(event: AuditEvent): Promise<void> {
  const endpoint = process.env.AUDIT_HTTP_ENDPOINT?.trim();
  if (!endpoint) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUDIT_HTTP_TIMEOUT_MS);

  try {
    const token = process.env.AUDIT_HTTP_BEARER_TOKEN?.trim();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(event),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn(`[audit] http_sink_failed status=${response.status}`);
    }
  } catch (error) {
    console.warn(`[audit] http_sink_failed ${error instanceof Error ? error.message : "unknown_error"}`);
  } finally {
    clearTimeout(timeout);
  }
}

export function recordAuditEvent(event: AuditEvent): void {
  // Default serverless-safe sink: stdout/collector.
  console.log(`[audit] ${JSON.stringify(event)}`);

  void sendAuditEventToHttp(event);

  if (process.env.AUDIT_LOG_TO_FILE !== "true") {
    return;
  }

  if (isServerlessRuntime()) {
    console.warn("[audit] file_sink_skipped serverless_runtime");
    return;
  }

  void appendAuditEventToFile(event).catch((error) => {
    console.warn(`[audit] file_sink_failed ${error instanceof Error ? error.message : "unknown_error"}`);
  });
}
