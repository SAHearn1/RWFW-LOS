import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import InstitutionPanel from "@/components/super-admin/InstitutionPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";

export default async function SuperAdminInstitutionsPage() {
  const role = await getCurrentAppRole();

  if (role !== "super_admin") {
    return <ForbiddenPanel message="Institution management is restricted to Super Admins." />;
  }

  return <InstitutionPanel />;
}
