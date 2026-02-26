import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import InstitutionsPanel from "@/components/super-admin/InstitutionsPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function SuperAdminInstitutionsPage() {
  const role = await getCurrentAppRole();

  if (!role || !isRoleAllowedForPath("/app/super-admin/institutions", role)) {
    return <ForbiddenPanel message="Institution management is restricted to super-admins." />;
  }

  return <InstitutionsPanel />;
}
