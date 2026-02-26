import Link from "next/link";

import RootworkMark from "@/components/brand/RootworkMark";

export default function AdminInfoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" aria-label="RootWork LOS home" className="flex items-center gap-2">
            <RootworkMark className="h-8 w-auto" />
            <span className="text-base font-semibold tracking-tight text-slate-900">RootWork</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link className="text-sm text-slate-600 hover:text-slate-900" href="/">
              Home
            </Link>
            <Link
              className="rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              href="/sign-in"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-16">
        <section className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Administrator Access
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Governance and oversight for your learning organization.
          </h1>
          <p className="max-w-2xl text-base text-slate-700">
            RootWork administrators manage verification standards, evidence readiness, and export
            operations. Access is role-scoped and requires an active organization assignment through
            Clerk.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Standards Monitoring</h2>
            <p className="mt-2 text-sm text-slate-600">
              Review the active verification standards applied to learner artifacts across your
              organization.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Evidence Readiness</h2>
            <p className="mt-2 text-sm text-slate-600">
              Track ledger evidence volume and consistency to confirm your institution&apos;s
              reporting posture.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Export Controls</h2>
            <p className="mt-2 text-sm text-slate-600">
              Validate release and reporting readiness before delivering exports to stakeholders.
            </p>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">How to request admin access</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Sign in with your institutional or organizational account.</li>
            <li>
              Ask your RootWork super-administrator to assign the{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">admin</code> role to your
              Clerk user ID.
            </li>
            <li>
              Confirm your organization assignment is active &mdash; the{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">orgId</code> field in your
              profile must be populated before accessing{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/app</code>.
            </li>
            <li>
              Once your role and organization are configured, navigate to{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/app</code> to reach the
              Admin dashboard.
            </li>
          </ol>
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">Access requirements</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            <li>
              Clerk organization membership is required &mdash; personal accounts cannot hold the
              admin role.
            </li>
            <li>Role assignment must be made by a super-administrator, not self-assigned.</li>
            <li>Route access is enforced server-side on every request via middleware.</li>
          </ul>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            className="rounded bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            href="/sign-in"
          >
            Continue to Sign In
          </Link>
          <Link
            className="rounded border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            href="/"
          >
            Back to Landing
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">
        RootWork LOS &mdash; Learning Operations System
      </footer>
    </div>
  );
}
