import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import AdminEvidenceView from "@/components/evidence/AdminEvidenceView";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function EvidencePage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/evidence", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  return <AdminEvidenceView />;
}
