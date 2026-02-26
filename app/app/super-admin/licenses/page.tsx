import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import LicensesPanel from "@/components/super-admin/LicensesPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function SuperAdminLicensesPage() {
  const role = await getCurrentAppRole();

  if (!role || !isRoleAllowedForPath("/app/super-admin/licenses", role)) {
    return <ForbiddenPanel message="License management is restricted to super-admins." />;
  }

  return <LicensesPanel />;
}
