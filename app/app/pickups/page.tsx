import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function PickupsPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/pickups", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  return (
    <section className="space-y-4" data-tour="pickups-page">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Pickups</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Track unresolved learner pickups and schedule facilitation follow-through.
      </p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Pickups now render through a dedicated facilitator route page.
      </div>
    </section>
  );
}
