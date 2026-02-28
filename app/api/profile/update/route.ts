import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

type UpdateProfileBody = {
  displayName?: string;
};

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return NextResponse.json(
      { error: "Authenticated session required." },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  let body: UpdateProfileBody;
  try {
    body = (await request.json()) as UpdateProfileBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!displayName || displayName.length > 100) {
    return NextResponse.json(
      { error: "displayName must be 1–100 characters." },
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

  // Split displayName into first/last for Clerk
  const parts = displayName.split(/\s+/);
  const firstName = parts[0] ?? displayName;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

  let clerkResponse: globalThis.Response;
  try {
    clerkResponse = await fetch(
      `https://api.clerk.com/v1/users/${encodeURIComponent(user.id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      }
    );
  } catch (err) {
    console.error("[profile/update] clerk_fetch_failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Failed to reach Clerk API." },
      { status: 502, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!clerkResponse.ok) {
    return NextResponse.json(
      { error: `Clerk API error: ${clerkResponse.status}` },
      { status: 502, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const doneAtIso = new Date().toISOString();
  recordAuditEvent({
    traceId,
    eventType: "profile.update_display_name",
    role,
    actorId: user.id,
    severity: "info",
    createdAtIso: doneAtIso,
    metadata: { displayName },
  });

  return NextResponse.json(
    { displayName, doneAtIso },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
