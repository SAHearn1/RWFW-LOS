import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import CohortsList from "@/components/cohorts/CohortsList";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function CohortsPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/cohorts", role)) {
    return <ForbiddenPanel message="Cohorts is restricted to facilitators." />;
  }

  return <CohortsList />;
}
