import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import StudioWorkspace from "@/components/studio/StudioWorkspace";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function StudioPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/studio", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  return <StudioWorkspace />;
}
