import Link from "next/link";

export default function SuperAdminHome() {
  return (
    <div className="space-y-8">
      <div>
        <p data-tour="page-description" className="mt-1 text-sm text-slate-500">
          Platform-wide authority: user accounts, teacher assignment, licensing, and institution management.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">—</p>
          <p className="mt-1 text-xs text-slate-400">Connect user roster to live data</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active Licenses</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">—</p>
          <p className="mt-1 text-xs text-slate-400">Institutional + enterprise + trials</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active Trials</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">—</p>
          <p className="mt-1 text-xs text-slate-400">Expiring within 7 days flagged</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending Teachers</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">—</p>
          <p className="mt-1 text-xs text-slate-400">Awaiting role assignment</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Link
          href="/app/super-admin/users"
          data-tour="user-roster-entry"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
        >
          <h2 className="text-base font-semibold text-slate-800 group-hover:text-slate-900">User Roster</h2>
          <p className="mt-1 text-sm text-slate-500">
            View, search, and manage all platform accounts. Edit roles and org assignments.
          </p>
        </Link>

        <Link
          href="/app/super-admin/teachers"
          data-tour="teacher-assignment-entry"
          className="group rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm transition hover:border-amber-400 hover:shadow-md"
        >
          <h2 className="text-base font-semibold text-amber-900 group-hover:text-amber-950">Teacher Assignment</h2>
          <p className="mt-1 text-sm text-amber-700">
            Only Super Admins may grant the Teacher role. Authorize educators and link them to institutions.
          </p>
        </Link>

        <Link
          href="/app/super-admin/licenses"
          data-tour="license-manager-entry"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
        >
          <h2 className="text-base font-semibold text-slate-800 group-hover:text-slate-900">License Manager</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create trial periods, issue institutional licenses, and configure enterprise seat allocations.
          </p>
        </Link>

        <Link
          href="/app/super-admin/institutions"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
        >
          <h2 className="text-base font-semibold text-slate-800 group-hover:text-slate-900">Institutions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage institution accounts, delegate local admin access, and view per-institution usage.
          </p>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Authority Boundaries</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          <li>• Super Admin is the <strong>sole authority</strong> for granting and revoking the Teacher role.</li>
          <li>• Local Admins (delegated per institution) can manage their institution&apos;s learner and staff accounts only.</li>
          <li>• Trial accounts expire automatically — status sync runs on each dashboard load.</li>
        </ul>
      </div>
    </div>
  );
}
