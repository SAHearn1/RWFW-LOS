import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
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

  return (
    <section className="space-y-4" data-tour="portfolio-page">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Portfolio</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Curate published artifacts and evidence highlights for credential and export readiness.
      </p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Portfolio surface is now an owned route page instead of a generic placeholder.
      </div>
    </section>
  );
}
