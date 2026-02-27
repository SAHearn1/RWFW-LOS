import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import StandardsManager from "@/components/standards/StandardsManager";
import StandardsRegistry from "@/components/standards/StandardsRegistry";
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

  if (role === "admin" || role === "super_admin") {
    return <StandardsManager />;
  }

  return <StandardsRegistry />;
}
