import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { createDbLedgerAdapter, shouldUseDbLedger } from "@/lib/ledger/dbAdapter";
import { parseAppRole } from "@/lib/auth/userRole";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export type CommandCenterActivity = {
  type: string;
  label: string;
  timestampIso: string;
};

export type CommandCenterStats = {
  activeCohorts: number;
  pendingReviews: number;
  pickupQueueLength: number;
  recentActivity: CommandCenterActivity[];
};

// GET /api/command-center
// Auth: teacher, professional_development only (403 otherwise)
export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const headers = { [TRACE_HEADER]: traceId };

  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const user = await currentUser();
  const callerRole = parseAppRole(user?.publicMetadata?.role);

  if (callerRole !== "teacher" && callerRole !== "professional_development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  }

  try {
    // --- activeCohorts: count via Clerk org list ---
    let activeCohorts = 0;
    if (orgId) {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      // Count the org as 1 active cohort; if there were multiple orgs we'd list them
      activeCohorts = org ? 1 : 0;
    }

    // --- pendingReviews: artifact records in ledger (server-side adapter) ---
    const adapter = shouldUseDbLedger() ? createDbLedgerAdapter() : localLedgerAdapter;
    const allRecords = adapter.readAll();
    const pendingReviews = allRecords.filter((r) => r.type === "artifact").length;

    // --- pickupQueueLength: flag-gated stub ---
    const pickupEnabled = process.env.NEXT_PUBLIC_ENABLE_PICKUP === "true";
    const pickupQueueLength = pickupEnabled ? 3 : 0;

    // --- recentActivity: last 5 ledger records (any type) ---
    const sorted = [...allRecords].sort((a, b) =>
      b.updatedAtIso.localeCompare(a.updatedAtIso)
    );
    const recentActivity: CommandCenterActivity[] = sorted.slice(0, 5).map((r) => ({
      type: r.type,
      label: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} record for mission ${r.missionId}`,
      timestampIso: r.updatedAtIso,
    }));

    const stats: CommandCenterStats = {
      activeCohorts,
      pendingReviews,
      pickupQueueLength,
      recentActivity,
    };

    return NextResponse.json(stats, { status: 200, headers });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers }
    );
  }
}
