import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

type ClerkWebhookEvent = {
  type?: string;
  data?: {
    id?: string;
    public_metadata?: Record<string, unknown>;
    private_metadata?: Record<string, unknown>;
  };
};

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const provided = signature.trim().toLowerCase();

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
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
      metadata: { reason: "signature_mismatch" }
    });

    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401, headers: { [TRACE_HEADER]: traceId } });
  }

  let event: ClerkWebhookEvent;
  try {
    event = JSON.parse(body) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const eventType = event.type ?? "unknown";
  const userId = event.data?.id ?? "unknown";
  const role = typeof event.data?.public_metadata?.role === "string" ? event.data.public_metadata.role : "unassigned";

  const handledTypes = new Set(["user.created", "user.updated"]);
  const handled = handledTypes.has(eventType);

  recordAuditEvent({
    traceId,
    eventType: handled ? "clerk.webhook.processed" : "clerk.webhook.ignored",
    role: "system",
    severity: handled ? "info" : "warning",
    createdAtIso: new Date().toISOString(),
    metadata: {
      eventType,
      userId,
      role,
      handled
    }
  });

  return NextResponse.json(
    {
      ok: true,
      eventType,
      handled,
      userId,
      role
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
