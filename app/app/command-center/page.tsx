import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import CommandCenterDashboard from "@/components/command-center/CommandCenterDashboard";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function CommandCenterPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/command-center", role)) {
    return <ForbiddenPanel message="Command Center is restricted to facilitators." />;
  }

  return <CommandCenterDashboard />;
}
