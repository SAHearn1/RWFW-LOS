import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell/AppShell";
import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { ORG_REQUIRED_ROLES } from "@/lib/auth/roles";
import { parseAppRole } from "@/lib/auth/userRole";
import { getNavItemsForRole } from "@/lib/nav/items";
import { recordAuditEvent } from "@/lib/observability/audit";
import { createTraceId } from "@/lib/observability/trace";

export default async function ProtectedAppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, orgId } = await auth();
  const traceId = createTraceId();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    recordAuditEvent({
      traceId,
      eventType: "app.layout.session_incomplete",
      role: "unknown",
      actorId: userId ?? undefined,
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { reason: "currentUser_returned_null" }
    });
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <ForbiddenPanel message="Authentication session is incomplete. Please sign out and sign in again." />
      </main>
    );
  }

  const role = parseAppRole(user.publicMetadata?.role);

  if (!role) {
    recordAuditEvent({
      traceId,
      eventType: "app.layout.no_role",
      role: "unassigned",
      actorId: user.id,
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { reason: "no_valid_role_in_metadata" }
    });
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <ForbiddenPanel message="Your account is authenticated but has no valid role assigned. Please contact an administrator." />
      </main>
    );
  }

  // ORG_REQUIRED_ROLES is the single source of truth for which roles need an orgId.
  // adult_learner and student_independent are intentionally excluded.
  if (ORG_REQUIRED_ROLES.has(role) && !orgId) {
    recordAuditEvent({
      traceId,
      eventType: "app.layout.org_required",
      role,
      actorId: user.id,
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { reason: "org_required_but_missing" }
    });
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <ForbiddenPanel message="An organization assignment is required for this role. Contact an administrator." />
      </main>
    );
  }

  const navItems = getNavItemsForRole(role);
  const userLabel = user.fullName || user.primaryEmailAddress?.emailAddress || "Authenticated user";

  return (
    <>
      <AppShell role={role} navItems={navItems} userLabel={userLabel}>
        {children}
      </AppShell>
      <OnboardingTour role={role} />
    </>
  );
}
