import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function CohortsPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/cohorts", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  return (
    <section className="space-y-4" data-tour="cohorts-page">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Cohorts</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Monitor cohort pacing, engagement checkpoints, and facilitation readiness signals.
      </p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Cohorts now render from a dedicated page instead of a generic placeholder surface.
      </div>
    </section>
  );
}
