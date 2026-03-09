import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

type AuditEntry = {
  traceId: string;
  eventType: string;
  role: string;
  orgId?: string;
  actorId?: string;
  severity: string;
  metadata?: Record<string, unknown>;
  createdAtIso: string;
};

const AUDIT_LOG_PATH = resolve("docs", "status", "audit-log.ndjson");

async function readAuditLog(): Promise<AuditEntry[]> {
  try {
    const raw = await readFile(AUDIT_LOG_PATH, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    const entries: AuditEntry[] = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line) as AuditEntry);
      } catch {
        // skip malformed lines
      }
    }
    return entries.reverse(); // most recent first
  } catch {
    return [];
  }
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (role !== "super_admin") {
    return NextResponse.json(
      { error: "super_admin role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(parseInt(limitParam ?? "100", 10) || 100, 500);

  const entries = await readAuditLog();
  const page = entries.slice(0, limit);

  const fileLoggingEnabled = process.env.AUDIT_LOG_TO_FILE === "true";
  const isServerless = process.env.VERCEL === "1";
  const source: "file" | "stdout_only" =
    fileLoggingEnabled && !isServerless ? "file" : "stdout_only";

  return NextResponse.json(
    { entries: page, total: entries.length, limit, source, fileLoggingEnabled },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
