import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { [TRACE_HEADER]: traceId } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const role = parseAppRole((body as Record<string, unknown>)?.role);
  if (!role) {
    return NextResponse.json({ error: "Invalid or missing role value." }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  // Org-required roles cannot be self-assigned — they require an invite code or admin action.
  if (role === "teacher" || role === "professional_development" || role === "admin") {
    return NextResponse.json(
      { error: "This role requires an invite code or administrator assignment." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const b = body as Record<string, unknown>;
  const requiresParentalConsent = b.requiresParentalConsent === true;
  const guardianEmail = typeof b.guardianEmail === "string" ? b.guardianEmail.trim() : undefined;

  try {

  const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        role,
        ...(requiresParentalConsent ? { requiresParentalConsent: true } : {}),
        ...(guardianEmail ? { guardianEmail } : {}),
      },
    });
    recordAuditEvent({
      traceId,
      eventType: "user.role.self-assigned",
      role,
      severity: "info",
      createdAtIso: new Date().toISOString(),
      metadata: {
        userId,
        assignedRole: role,
        method: "onboarding.set-role",
        requiresParentalConsent,
        ...(requiresParentalConsent ? { guardianEmailProvided: Boolean(guardianEmail) } : {}),
      },
    });
    return NextResponse.json({ ok: true, role }, { status: 200, headers: { [TRACE_HEADER]: traceId } });
  } catch (err) {
    recordAuditEvent({
      traceId,
      eventType: "user.role.self-assign.failed",
      role: "system",
      severity: "error",
      createdAtIso: new Date().toISOString(),
      metadata: { userId, error: String(err) },
    });
    return NextResponse.json({ error: "Failed to assign role. Please try again." }, { status: 500, headers: { [TRACE_HEADER]: traceId } });
  }
}
