import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { getLicensingAdapter } from "@/lib/licensing/dynamoAdapter";
import type { LicenseTenant } from "@/lib/licensing/types";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

function withTrace(status: number, traceId: string, body: unknown): Response {
  return NextResponse.json(body, { status, headers: { [TRACE_HEADER]: traceId } });
}

function isLicenseTenant(value: unknown): value is LicenseTenant {
  if (!value || typeof value !== "object") return false;
  const t = value as Partial<LicenseTenant>;
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    (t.type === "trial" || t.type === "institutional" || t.type === "enterprise") &&
    (t.status === "active" || t.status === "expired" || t.status === "suspended") &&
    typeof t.startsAtIso === "string" &&
    typeof t.seatCount === "number" &&
    typeof t.contactEmail === "string" &&
    typeof t.createdAtIso === "string" &&
    typeof t.createdBySuperAdminId === "string"
  );
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id || role !== "super_admin") {
    return withTrace(403, traceId, { error: "super_admin role required." });
  }

  const adapterResult = getLicensingAdapter();
  if (!adapterResult.available) {
    return withTrace(503, traceId, { error: adapterResult.reason });
  }

  const tenants = await adapterResult.adapter.getAllTenants();
  return withTrace(200, traceId, { tenants, total: tenants.length });
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id || role !== "super_admin") {
    return withTrace(403, traceId, { error: "super_admin role required." });
  }

  const adapterResult = getLicensingAdapter();
  if (!adapterResult.available) {
    return withTrace(503, traceId, { error: adapterResult.reason });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withTrace(400, traceId, { error: "Invalid JSON body." });
  }

  if (!isLicenseTenant(body)) {
    return withTrace(400, traceId, { error: "Invalid LicenseTenant payload." });
  }

  const tenant = await adapterResult.adapter.upsertTenant(body);
  return withTrace(200, traceId, { tenant });
}

export async function DELETE(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id || role !== "super_admin") {
    return withTrace(403, traceId, { error: "super_admin role required." });
  }

  const adapterResult = getLicensingAdapter();
  if (!adapterResult.available) {
    return withTrace(503, traceId, { error: adapterResult.reason });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return withTrace(400, traceId, { error: "id query param is required." });
  }

  await adapterResult.adapter.deleteTenant(id);
  return withTrace(200, traceId, { deleted: true, id });
}
