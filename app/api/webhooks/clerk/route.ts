import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { parseAppRole } from "@/lib/auth/userRole";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

type MetadataRecord = Record<string, unknown>;

type ClerkWebhookEvent = {
  type?: string;
  data?: {
    id?: string;
    public_metadata?: MetadataRecord;
    private_metadata?: MetadataRecord;
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

function readString(metadata: MetadataRecord | undefined, keys: string[]): string | undefined {
  if (!metadata) {
    return undefined;
  }

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

async function syncPublicMetadata(userId: string, role: string | null, orgId: string | undefined): Promise<{ synced: boolean; reason: string }> {
  if (!role && !orgId) {
    return { synced: false, reason: "no_supported_metadata" };
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY?.trim();
  if (!clerkSecret) {
    return { synced: false, reason: "missing_clerk_secret" };
  }

  const patch: Record<string, unknown> = {
    public_metadata: {
      ...(role ? { role } : {}),
      ...(orgId ? { orgId } : {})
    }
  };

  let response: globalThis.Response;
  try {
    response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}/metadata`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patch)
    });
  } catch (error) {
    console.error("[webhooks/clerk] clerk_patch_network_error", error instanceof Error ? error.message : "unknown");
    return { synced: false, reason: "clerk_patch_network_error" };
  }

  if (!response.ok) {
    return { synced: false, reason: `clerk_patch_failed:${response.status}` };
  }

  return { synced: true, reason: "ok" };
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET is not configured." }, { status: 500, headers: { [TRACE_HEADER]: traceId } });
  }

  const signature = request.headers.get("svix-signature") ?? request.headers.get("x-clerk-signature-sha256");
  if (!signature) {
    return NextResponse.json({ error: "Missing webhook signature header." }, { status: 400, headers: { [TRACE_HEADER]: traceId } });
  }

  const body = await request.text();
  const valid = verifySignature(body, signature, webhookSecret);

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
  const publicRole = readString(event.data?.public_metadata, ["role"]);
  const privateRole = readString(event.data?.private_metadata, ["role"]);
  const normalizedRole = parseAppRole(privateRole ?? publicRole ?? null);
  const publicOrgId = readString(event.data?.public_metadata, ["orgId", "org_id"]);
  const privateOrgId = readString(event.data?.private_metadata, ["orgId", "org_id"]);
  const normalizedOrgId = privateOrgId ?? publicOrgId;

  const handledTypes = new Set(["user.created", "user.updated"]);
  const handled = handledTypes.has(eventType);

  let metadataSync = { synced: false, reason: "event_ignored" };
  if (handled && userId !== "unknown") {
    const roleRequiresSync = normalizedRole !== null && normalizedRole !== publicRole;
    const orgRequiresSync = Boolean(normalizedOrgId && normalizedOrgId !== publicOrgId);

    if (roleRequiresSync || orgRequiresSync) {
      metadataSync = await syncPublicMetadata(userId, normalizedRole, normalizedOrgId);
    } else {
      metadataSync = { synced: false, reason: "already_in_sync" };
    }
  }

  recordAuditEvent({
    traceId,
    eventType: handled ? "clerk.webhook.processed" : "clerk.webhook.ignored",
    role: "system",
    severity: handled ? "info" : "warning",
    createdAtIso: new Date().toISOString(),
    metadata: {
      eventType,
      userId,
      role: normalizedRole ?? "unassigned",
      orgId: normalizedOrgId,
      handled,
      metadataSynced: metadataSync.synced,
      syncReason: metadataSync.reason
    }
  });

  return NextResponse.json(
    {
      ok: true,
      eventType,
      handled,
      userId,
      role: normalizedRole ?? "unassigned",
      orgId: normalizedOrgId,
      metadataSynced: metadataSync.synced,
      syncReason: metadataSync.reason
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
