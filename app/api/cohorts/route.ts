import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { currentUser } from "@clerk/nextjs/server";

export type CohortMember = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
};

export type CohortData = {
  orgId: string;
  name: string;
  members: CohortMember[];
};

export async function GET(): Promise<Response> {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const callerRole = parseAppRole(user?.publicMetadata?.role);

  // Only facilitator roles can fetch cohort data
  if (callerRole !== "teacher" && callerRole !== "professional_development" && callerRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!orgId) {
    return NextResponse.json({ cohorts: [], message: "No organization assigned" }, { status: 200 });
  }

  try {
    const client = await clerkClient();

    // Get org details
    const org = await client.organizations.getOrganization({ organizationId: orgId });

    // Get membership list
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });

    const members: CohortMember[] = (memberships.data ?? []).map((m) => ({
      userId: m.publicUserData?.userId ?? "",
      firstName: m.publicUserData?.firstName ?? null,
      lastName: m.publicUserData?.lastName ?? null,
      email: m.publicUserData?.identifier ?? null,
      role: m.role ?? null,
    }));

    const cohort: CohortData = {
      orgId,
      name: org.name,
      members,
    };

    return NextResponse.json({ cohorts: [cohort] }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
