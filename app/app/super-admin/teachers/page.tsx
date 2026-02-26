import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import TeachersPanel from "@/components/super-admin/TeachersPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function SuperAdminTeachersPage() {
  const role = await getCurrentAppRole();

  if (!role || !isRoleAllowedForPath("/app/super-admin/teachers", role)) {
    return <ForbiddenPanel message="Teacher management is restricted to super-admins." />;
  }

  return <TeachersPanel />;
}
