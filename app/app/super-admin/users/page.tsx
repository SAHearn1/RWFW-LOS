import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import UsersPanel from "@/components/super-admin/UsersPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function SuperAdminUsersPage() {
  const role = await getCurrentAppRole();

  if (!role || !isRoleAllowedForPath("/app/super-admin/users", role)) {
    return <ForbiddenPanel message="User management is restricted to super-admins." />;
  }

  return <UsersPanel />;
}
