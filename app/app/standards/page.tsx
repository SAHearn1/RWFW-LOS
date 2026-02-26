import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";

export default async function StandardsPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/standards", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">
        Standards
      </h1>
      <p className="text-sm text-slate-600">Standards registry administration and plugin configuration.</p>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Standards admin view coming soon.
      </div>
    </section>
  );
}
