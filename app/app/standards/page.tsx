import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import StandardsManager from "@/components/standards/StandardsManager";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function StandardsPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/standards", role)) {
    return <ForbiddenPanel message="Standards registry is restricted to administrators." />;
  }

  return <StandardsManager />;
}
