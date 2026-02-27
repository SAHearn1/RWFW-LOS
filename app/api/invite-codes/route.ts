import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { createInviteCode } from "@/lib/inviteCodes/adapter";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RWFW-${code}`;
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { [TRACE_HEADER]: traceId } });
  }

  // Only admins may generate invite codes.
  const user = await currentUser();
  const callerRole = parseAppRole(user?.publicMetadata?.role);
  if (callerRole !== "admin" && callerRole !== "super_admin") {
    return NextResponse.json({ error: "Only administrators can generate invite codes." }, { status: 403, headers: { [TRACE_HEADER]: traceId } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const b = body as Record<string, unknown>;
  const role = parseAppRole(b.role);
  if (!role || role === "admin") {
    return NextResponse.json({ error: "A valid non-admin role is required." }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const maxUses = typeof b.maxUses === "number" && b.maxUses > 0 ? b.maxUses : 1;
  const orgId = typeof b.orgId === "string" && b.orgId.trim() ? b.orgId.trim() : undefined;
  const expiresAtIso = typeof b.expiresAtIso === "string" && b.expiresAtIso.trim() ? b.expiresAtIso.trim() : undefined;

  const code = generateCode();

  try {
    const inviteCode = createInviteCode({ code, role, orgId, createdBy: userId, maxUses, expiresAtIso });
    recordAuditEvent({
      traceId,
      eventType: "invite-code.created",
      role: callerRole,
      severity: "info",
      createdAtIso: new Date().toISOString(),
      metadata: { code, targetRole: role, maxUses, orgId },
    });
    return NextResponse.json({ ok: true, inviteCode }, { status: 201, headers: { [TRACE_HEADER]: traceId } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: { [TRACE_HEADER]: traceId } });
  }
}
