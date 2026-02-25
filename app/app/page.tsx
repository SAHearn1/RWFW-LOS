import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import AdultLearnerHome from "@/components/dashboards/AdultLearnerHome";
import ProfessionalDevelopmentHome from "@/components/dashboards/ProfessionalDevelopmentHome";
import PLEHome from "@/components/ple/PLEHome";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function AppHomePage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  if (role === "adult_learner") {
    return <AdultLearnerHome />;
  }

  if (role === "professional_development") {
    return <ProfessionalDevelopmentHome />;
  }

  return <PLEHome />;
}