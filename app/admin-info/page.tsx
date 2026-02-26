import Link from "next/link";

export default function AdminInfoPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Administrator Information</h1>
      <p className="text-slate-600">
        RootWork LOS administrator accounts are provisioned by your institution. If you need admin
        access, contact your organization administrator or the RootWork support team.
      </p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Admin Role Capabilities</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
          <li>Manage standards registry and verification rules</li>
          <li>Review evidence records across your organization</li>
          <li>Export learner data and credentials</li>
          <li>Manage users, teachers, cohorts, and licenses</li>
          <li>Configure feature flags and system settings</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Getting Access</h2>
        <p className="text-sm text-slate-600">
          Admin accounts require an active Clerk organization membership. Your organization must be
          provisioned in RootWork before admin access can be granted. Contact your institution&apos;s
          RootWork coordinator to begin the provisioning process.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Already have an account?</h3>
        <p className="text-sm text-slate-600">
          Sign in at{" "}
          <Link href="/sign-in" className="text-sky-600 underline underline-offset-2">
            /sign-in
          </Link>{" "}
          to access your admin dashboard.
        </p>
      </section>
    </main>
  );
}
