import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import DataRetentionManager from "@/components/admin/DataRetentionManager";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function RetentionPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/retention", role)) {
    return <ForbiddenPanel message="Data retention management is restricted to administrators." />;
  }

  return <DataRetentionManager />;
}
