import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import type { UserRecord } from "@/lib/licensing/types";

export const runtime = "nodejs";

type ClerkEmailAddress = { email_address: string; id: string };

type ClerkUser = {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name: string | null;
  last_name: string | null;
  public_metadata: Record<string, unknown>;
  created_at: number; // ms epoch
};

function mapClerkUserToRecord(cu: ClerkUser): UserRecord {
  const email = cu.email_addresses[0]?.email_address ?? "";
  const fullName = [cu.first_name, cu.last_name].filter(Boolean).join(" ") || email;
  const meta = cu.public_metadata ?? {};
  const role = typeof meta.role === "string" ? meta.role : "student_independent";
  const orgId = typeof meta.orgId === "string" ? meta.orgId : null;
  const tenantId = typeof meta.tenantId === "string" ? meta.tenantId : null;

  return {
    userId: cu.id,
    email,
    fullName,
    role,
    orgId,
    tenantId,
    createdAtIso: new Date(cu.created_at).toISOString(),
  };
}

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (role !== "super_admin") {
    return NextResponse.json(
      { error: "super_admin role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY?.trim();
  if (!clerkSecret) {
    return NextResponse.json(
      { error: "CLERK_SECRET_KEY is not configured." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const clerkResponse = await fetch("https://api.clerk.com/v1/users?limit=100&order_by=-created_at", {
    method: "GET",
    headers: { Authorization: `Bearer ${clerkSecret}` },
  });

  if (!clerkResponse.ok) {
    return NextResponse.json(
      { error: `Clerk API error: ${clerkResponse.status}` },
      { status: 502, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const clerkUsers: ClerkUser[] = (await clerkResponse.json()) as ClerkUser[];
  const users: UserRecord[] = clerkUsers.map(mapClerkUserToRecord);

  return NextResponse.json(
    { users, total: users.length },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
