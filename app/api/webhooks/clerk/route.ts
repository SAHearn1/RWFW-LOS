import { createHmac, timingSafeEqual } from "node:crypto";

import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    public_metadata?: Record<string, unknown>;
  };
};

type ClerkUserUpdatedEvent = {
  type: "user.updated";
  data: {
    id: string;
    public_metadata?: Record<string, unknown>;
  };
};

type ClerkSessionCreatedEvent = {
  type: "session.created";
  data: {
    id: string;
    user_id: string;
  };
};

type ClerkWebhookEvent =
  | ClerkUserCreatedEvent
  | ClerkUserUpdatedEvent
  | ClerkSessionCreatedEvent;

function verifyHmacSignature(secret: string, body: string, svixSignatures: string): boolean {
  try {
    const mac = createHmac("sha256", secret).update(body).digest("hex");
    const expectedBuffer = Buffer.from(mac, "hex");
    // svixSignatures can be comma-separated list of "v1,<sig>" entries
    const sigs = svixSignatures.split(" ");
    for (const sig of sigs) {
      const parts = sig.split(",");
      const sigHex = parts[parts.length - 1];
      try {
        const actualBuffer = Buffer.from(sigHex ?? "", "hex");
        if (expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)) {
          return true;
        }
      } catch {
        // continue to next signature
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const timestamp = new Date().toISOString();

  const body = await request.text();
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  const svixSignatures = request.headers.get("svix-signature") ?? "";

  if (secret && svixSignatures) {
    const isValid = verifyHmacSignature(secret, body, svixSignatures);
    if (!isValid) {
      recordAuditEvent({
        traceId,
        eventType: "webhook.clerk.invalid_signature",
        role: "system",
        severity: "error",
        createdAtIso: timestamp,
      });
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401, headers: { [TRACE_HEADER]: traceId } }
      );
    }
  }

  let event: ClerkWebhookEvent;
  try {
    event = JSON.parse(body) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  recordAuditEvent({
    traceId,
    eventType: `webhook.clerk.${event.type}`,
    role: "system",
    severity: "info",
    createdAtIso: timestamp,
    metadata: { eventType: event.type },
  });

  if (event.type === "user.created") {
    const userId = event.data.id;
    const role = parseAppRole(event.data.public_metadata?.role);

    recordAuditEvent({
      traceId,
      eventType: "webhook.clerk.user_created",
      role: role ?? "unassigned",
      actorId: userId,
      severity: "info",
      createdAtIso: timestamp,
      metadata: {
        userId,
        email: event.data.email_addresses?.[0]?.email_address,
        role,
      },
    });
  }

  if (event.type === "user.updated") {
    const userId = event.data.id;
    const newRole = parseAppRole(event.data.public_metadata?.role);

    recordAuditEvent({
      traceId,
      eventType: "webhook.clerk.user_role_updated",
      role: newRole ?? "unassigned",
      actorId: userId,
      severity: "info",
      createdAtIso: timestamp,
      metadata: {
        userId,
        newRole,
      },
    });

    if (newRole) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: { role: newRole },
        });
      } catch (err) {
        recordAuditEvent({
          traceId,
          eventType: "webhook.clerk.metadata_sync_failed",
          role: newRole,
          actorId: userId,
          severity: "warning",
          createdAtIso: timestamp,
          metadata: {
            error: err instanceof Error ? err.message : "unknown_error",
          },
        });
      }
    }
  }

  if (event.type === "session.created") {
    const { user_id: userId, id: sessionId } = event.data;

    recordAuditEvent({
      traceId,
      eventType: "webhook.clerk.session_created",
      role: "system",
      actorId: userId,
      severity: "info",
      createdAtIso: timestamp,
      metadata: { sessionId, userId },
    });
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
