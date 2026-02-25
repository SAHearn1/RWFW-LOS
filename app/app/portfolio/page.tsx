import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import PortfolioView from "@/components/portfolio/PortfolioView";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function PortfolioPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/portfolio", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  return <PortfolioView />;
}
