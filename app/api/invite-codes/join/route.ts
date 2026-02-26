import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { validateAndConsumeInviteCode } from "@/lib/inviteCodes/adapter";
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

  const code = (body as Record<string, unknown>)?.code;
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const validation = validateAndConsumeInviteCode(code.trim().toUpperCase());

  if (!validation.valid) {
    const messages: Record<string, string> = {
      not_found: "Invite code not found. Please check the code and try again.",
      expired: "This invite code has expired.",
      exhausted: "This invite code has already been used the maximum number of times.",
    };
    recordAuditEvent({
      traceId,
      eventType: "invite-code.join.rejected",
      role: "system",
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { userId, code: code.trim(), reason: validation.reason },
    });
    return NextResponse.json(
      { error: messages[validation.reason] ?? "Invalid invite code." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const { inviteCode } = validation;

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: inviteCode.role,
        ...(inviteCode.orgId ? { orgId: inviteCode.orgId } : {}),
      },
    });
    recordAuditEvent({
      traceId,
      eventType: "invite-code.join.accepted",
      role: inviteCode.role,
      severity: "info",
      createdAtIso: new Date().toISOString(),
      metadata: { userId, code: code.trim(), assignedRole: inviteCode.role, orgId: inviteCode.orgId },
    });
    return NextResponse.json(
      { ok: true, role: inviteCode.role, orgId: inviteCode.orgId },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: { [TRACE_HEADER]: traceId } });
  }
}
