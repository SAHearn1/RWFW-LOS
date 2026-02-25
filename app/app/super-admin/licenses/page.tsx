import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import LicenseManager from "@/components/super-admin/LicenseManager";
import { getCurrentAppRole } from "@/lib/auth/currentRole";

export default async function SuperAdminLicensesPage() {
  const role = await getCurrentAppRole();

  if (role !== "super_admin") {
    return <ForbiddenPanel message="License Manager is restricted to Super Admins." />;
  }

  return <LicenseManager />;
}
