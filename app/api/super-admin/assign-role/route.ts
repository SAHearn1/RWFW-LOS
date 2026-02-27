import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { APP_ROLES } from "@/lib/auth/roles";
import { parseAppRole } from "@/lib/auth/userRole";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

type AssignRoleBody = {
  userId?: string;
  role?: string;
  orgId?: string | null;
};

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const actorRole = parseAppRole(user?.publicMetadata?.role);

  if (actorRole !== "super_admin") {
    return NextResponse.json(
      { error: "super_admin role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  let body: AssignRoleBody;
  try {
    body = (await request.json()) as AssignRoleBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const { userId, role, orgId } = body;

  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    return NextResponse.json(
      { error: "userId is required." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!role || !(APP_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${APP_ROLES.join(", ")}` },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY?.trim();
  if (!clerkSecret) {
    return NextResponse.json(
      { error: "CLERK_SECRET_KEY is not configured." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const patch: Record<string, unknown> = {
    public_metadata: {
      role,
      ...(orgId !== undefined ? { orgId: orgId ?? null } : {}),
    },
  };

  const clerkResponse = await fetch(
    `https://api.clerk.com/v1/users/${encodeURIComponent(userId.trim())}/metadata`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    }
  );

  if (!clerkResponse.ok) {
    return NextResponse.json(
      { error: `Clerk API error: ${clerkResponse.status}` },
      { status: 502, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const doneAtIso = new Date().toISOString();

  recordAuditEvent({
    traceId,
    eventType: "super_admin.assign_role",
    role: actorRole,
    actorId: user?.id,
    severity: "info",
    createdAtIso: doneAtIso,
    metadata: { userId: userId.trim(), role, orgId: orgId ?? null },
  });

  return NextResponse.json(
    { userId: userId.trim(), role, orgId: orgId ?? null, doneAtIso },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
