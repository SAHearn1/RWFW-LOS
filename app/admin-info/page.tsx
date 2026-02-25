import Link from "next/link";

export default function AdminInfoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-600">RootWork LOS</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Administrator Access and Governance</h1>
        <p className="text-base text-slate-700">
          Administrators manage standards, evidence posture, and exports. Access is role-scoped and requires an organization assignment.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">What Admin Access Includes</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Standards monitoring and verification oversight.</li>
          <li>Evidence readiness review for operational governance.</li>
          <li>Export workflow controls for reporting and release readiness.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">How to Request Access</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Sign in with your organizational account.</li>
          <li>Request the <code>admin</code> role from your RootWork administrator.</li>
          <li>Confirm your organization assignment before accessing <code>/app</code>.</li>
        </ol>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/sign-in">
          Continue to Sign In
        </Link>
        <Link className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800" href="/">
          Back to Landing
        </Link>
      </section>
    </main>
  );
}
