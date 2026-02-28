import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import AuditLogViewer from "@/components/super-admin/AuditLogViewer";
import { getCurrentAppRole } from "@/lib/auth/currentRole";

export default async function SuperAdminAuditLogPage() {
  const role = await getCurrentAppRole();

  if (role !== "super_admin") {
    return <ForbiddenPanel message="Audit log is restricted to Super Admins." />;
  }

  return <AuditLogViewer />;
}
