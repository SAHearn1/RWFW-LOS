import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import PickupsPanel from "@/components/pickups/PickupsPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function PickupsPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/pickups", role)) {
    return <ForbiddenPanel message="Pickups is restricted to facilitators." />;
  }

  return <PickupsPanel />;
}
