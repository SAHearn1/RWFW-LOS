import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function MissionsPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/missions", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  return (
    <section className="space-y-4" data-tour="missions-page">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Missions</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Track active missions, start new objectives, and monitor progression checkpoints.
      </p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Mission execution workspace is now owned by a dedicated route page.
      </div>
    </section>
  );
}
