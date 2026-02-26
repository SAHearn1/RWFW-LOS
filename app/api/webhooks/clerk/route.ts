import { createHmac, timingSafeEqual } from "node:crypto";

import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { type AppRole } from "@/lib/auth/roles";
import { parseAppRole } from "@/lib/auth/userRole";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

const DEFAULT_ROLE: AppRole = "student_independent";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const provided = signature.trim().toLowerCase();

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

type ClerkWebhookPayload = {
  type: string;
  data?: Record<string, unknown>;
};

async function handleUserCreated(
  data: Record<string, unknown>,
  traceId: string,
  now: string
): Promise<void> {
  const userId = typeof data.id === "string" ? data.id : null;
  if (!userId) return;

  // Read intended_role from unsafeMetadata (set by sign-up CTA, ticket #204).
  // Fall back to DEFAULT_ROLE when absent or invalid.
  const unsafeMetadata = (data.unsafe_metadata ?? {}) as Record<string, unknown>;
  const intendedRole = parseAppRole(unsafeMetadata.intended_role);
  const roleToAssign: AppRole = intendedRole ?? DEFAULT_ROLE;

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { role: roleToAssign },
    });
    recordAuditEvent({
      traceId,
      eventType: "user.role.assigned",
      role: roleToAssign,
      severity: "info",
      createdAtIso: now,
      metadata: { userId, assignedRole: roleToAssign, method: "webhook.user.created" },
    });
  } catch (err) {
    recordAuditEvent({
      traceId,
      eventType: "user.role.assignment.failed",
      role: "system",
      severity: "error",
      createdAtIso: now,
      metadata: { userId, error: String(err) },
    });
  }
}

function handleUserUpdated(
  data: Record<string, unknown>,
  traceId: string,
  now: string
): void {
  const userId = typeof data.id === "string" ? data.id : "unknown";
  const publicMetadata = (data.public_metadata ?? {}) as Record<string, unknown>;
  const updatedRole = parseAppRole(publicMetadata.role);
  recordAuditEvent({
    traceId,
    eventType: "user.updated",
    role: updatedRole ?? "system",
    severity: "info",
    createdAtIso: now,
    metadata: { userId, role: updatedRole ?? null },
  });
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET is not configured." }, { status: 500, headers: { [TRACE_HEADER]: traceId } });
  }

  const signature = request.headers.get("svix-signature") ?? request.headers.get("x-clerk-signature-sha256");
  if (!signature) {
    return NextResponse.json({ error: "Missing webhook signature header." }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const body = await request.text();
  const valid = verifySignature(body, signature, secret);

  if (!valid) {
    recordAuditEvent({
      traceId,
      eventType: "clerk.webhook.rejected",
      role: "system",
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { reason: "signature_mismatch" },
    });

    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401, headers: { [TRACE_HEADER]: traceId } });
  }

  recordAuditEvent({
    traceId,
    eventType: "clerk.webhook.accepted",
    role: "system",
    severity: "info",
    createdAtIso: new Date().toISOString(),
  });

  let parsed: ClerkWebhookPayload | null = null;
  try {
    parsed = JSON.parse(body) as ClerkWebhookPayload;
  } catch {
    // Body could not be parsed as JSON — proceed without event handling.
  }

  if (parsed) {
    const now = new Date().toISOString();
    const eventType = parsed.type ?? "unknown";
    const data = (parsed.data ?? {}) as Record<string, unknown>;

    if (eventType === "user.created") {
      await handleUserCreated(data, traceId, now);
    } else if (eventType === "user.updated") {
      handleUserUpdated(data, traceId, now);
    } else {
      recordAuditEvent({
        traceId,
        eventType,
        role: "system",
        severity: "info",
        createdAtIso: now,
        metadata: { clerkEventType: eventType },
      });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: { [TRACE_HEADER]: traceId } });
}
