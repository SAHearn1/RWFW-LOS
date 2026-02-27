import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import type { StandardDescriptor } from "@/lib/standards/contracts/types";
import { getStandardsAdapter } from "@/lib/standards/dynamoAdapter";
import { DEFAULT_STANDARDS } from "@/lib/standards/verifier/localVerifier";

export const runtime = "nodejs";

const WRITE_ROLES = new Set(["admin", "super_admin"]);

function withTrace(status: number, traceId: string, body: unknown): Response {
  return NextResponse.json(body, { status, headers: { [TRACE_HEADER]: traceId } });
}

function isStandardDescriptorArray(value: unknown): value is StandardDescriptor[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      Array.isArray(item.requiredKeywords) &&
      item.requiredKeywords.every((k: unknown) => typeof k === "string")
  );
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  const adapterResult = getStandardsAdapter();
  if (!adapterResult.available) {
    // Return defaults when backend is unconfigured
    return withTrace(200, traceId, {
      standards: DEFAULT_STANDARDS,
      source: "default"
    });
  }

  const stored = await adapterResult.adapter.readConfig();
  return withTrace(200, traceId, {
    standards: stored ?? DEFAULT_STANDARDS,
    source: stored ? "database" : "default"
  });
}

export async function PUT(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return withTrace(403, traceId, { error: "Authorized role required." });
  }

  if (!WRITE_ROLES.has(role)) {
    return withTrace(403, traceId, { error: "admin or super_admin role required." });
  }

  const adapterResult = getStandardsAdapter();
  if (!adapterResult.available) {
    return withTrace(503, traceId, { error: adapterResult.reason });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withTrace(400, traceId, { error: "Invalid JSON body." });
  }

  const standards = (body as { standards?: unknown })?.standards ?? body;
  if (!isStandardDescriptorArray(standards)) {
    return withTrace(400, traceId, {
      error: "Body must be an array (or { standards: [...] }) of StandardDescriptor objects."
    });
  }

  await adapterResult.adapter.writeConfig(standards);
  return withTrace(200, traceId, { saved: true, count: standards.length });
}
