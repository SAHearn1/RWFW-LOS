import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell/AppShell";
import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { parseAppRole } from "@/lib/auth/userRole";
import { getNavItemsForRole } from "@/lib/nav/items";

export default async function ProtectedAppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <ForbiddenPanel message="Authentication session is incomplete. Please sign out and sign in again." />
      </main>
    );
  }

  const role = parseAppRole(user.publicMetadata?.role);

  if (!role) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <ForbiddenPanel message="Your account is authenticated but has no valid role assigned. Please contact an administrator." />
      </main>
    );
  }

  if ((role === "student_enrolled" || role === "teacher" || role === "professional_development" || role === "admin") && !orgId) {
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

