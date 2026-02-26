import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import BuilderWorkspace from "@/components/builder/BuilderWorkspace";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function BuilderPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/builder", role)) {
    return <ForbiddenPanel message="Builder is restricted to facilitators." />;
  }

  return <BuilderWorkspace />;
}
