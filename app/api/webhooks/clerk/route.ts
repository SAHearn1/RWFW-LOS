import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

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
      metadata: { reason: "signature_mismatch" }
    });

    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401, headers: { [TRACE_HEADER]: traceId } });
  }

  recordAuditEvent({
    traceId,
    eventType: "clerk.webhook.accepted",
    role: "system",
    severity: "info",
    createdAtIso: new Date().toISOString()
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

    const knownEventTypes = ["user.created", "user.updated", "session.created"];
    const severity = "info" as const;

    if (knownEventTypes.includes(eventType)) {
      recordAuditEvent({
        traceId,
        eventType,
        role: "system",
        severity,
        createdAtIso: now,
        metadata: { clerkEventType: eventType }
      });
    } else {
      recordAuditEvent({
        traceId,
        eventType,
        role: "system",
        severity,
        createdAtIso: now,
        metadata: { clerkEventType: eventType }
      });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: { [TRACE_HEADER]: traceId } });
}
