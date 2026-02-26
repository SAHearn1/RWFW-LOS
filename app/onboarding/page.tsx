import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import RoleSelectWizard from "@/components/onboarding/RoleSelectWizard";
import { parseAppRole } from "@/lib/auth/userRole";

type OnboardingPageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const existingRole = parseAppRole(user?.publicMetadata?.role);

  // Role already assigned — send straight to the app.
  if (existingRole) {
    redirect("/app");
  }

  const params = await searchParams;
  const intendedRole = parseAppRole(params.role);

  return (
    <div className="min-h-screen bg-[#F8F7F2] flex items-center justify-center px-6 py-12">
      <RoleSelectWizard intendedRole={intendedRole} />
    </div>
  );
}
