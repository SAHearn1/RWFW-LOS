import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import { getCurrentAppRole } from "@/lib/auth/currentRole";

export default async function SuperAdminInstitutionsPage() {
  const role = await getCurrentAppRole();

  if (role !== "admin") {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">
        Institutions
      </h1>
      <p className="text-sm text-slate-600">Super-admin institution management.</p>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Institution management coming soon.
      </div>
    </section>
  );
}
