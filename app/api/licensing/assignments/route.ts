import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { getLicensingAdapter } from "@/lib/licensing/dynamoAdapter";
import type { TeacherAssignmentRecord } from "@/lib/licensing/types";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["admin", "super_admin"]);

function withTrace(status: number, traceId: string, body: unknown): Response {
  return NextResponse.json(body, { status, headers: { [TRACE_HEADER]: traceId } });
}

function isAssignment(value: unknown): value is TeacherAssignmentRecord {
  if (!value || typeof value !== "object") return false;
  const a = value as Partial<TeacherAssignmentRecord>;
  return (
    typeof a.id === "string" &&
    typeof a.userId === "string" &&
    typeof a.email === "string" &&
    typeof a.fullName === "string" &&
    typeof a.orgId === "string" &&
    typeof a.assignedBySuperId === "string" &&
    typeof a.assignedAtIso === "string"
  );
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id || !ALLOWED_ROLES.has(role)) {
    return withTrace(403, traceId, { error: "admin or super_admin role required." });
  }

  const adapterResult = getLicensingAdapter();
  if (!adapterResult.available) {
    return withTrace(503, traceId, { error: adapterResult.reason });
  }

  const assignments = await adapterResult.adapter.getAllAssignments();
  return withTrace(200, traceId, { assignments, total: assignments.length });
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id || !ALLOWED_ROLES.has(role)) {
    return withTrace(403, traceId, { error: "admin or super_admin role required." });
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

  if (!isAssignment(body)) {
    return withTrace(400, traceId, { error: "Invalid TeacherAssignmentRecord payload." });
  }

  const assignment = await adapterResult.adapter.upsertAssignment(body);
  return withTrace(200, traceId, { assignment });
}

export async function DELETE(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id || !ALLOWED_ROLES.has(role)) {
    return withTrace(403, traceId, { error: "admin or super_admin role required." });
  }

  const adapterResult = getLicensingAdapter();
  if (!adapterResult.available) {
    return withTrace(503, traceId, { error: adapterResult.reason });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return withTrace(400, traceId, { error: "id query param is required." });
  }

  await adapterResult.adapter.deleteAssignment(id);
  return withTrace(200, traceId, { deleted: true, id });
}
