import Link from "next/link";

export default function CommandCenterDashboard() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Command Center</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Your operational hub — active cohorts, pickup queue, and review backlog at a glance.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Active Cohorts</h2>
          <p className="mt-1 text-slate-600">View and manage the cohorts you are facilitating.</p>
          <Link href="/app/cohorts" className="mt-2 inline-block text-xs text-slate-500 underline">Go to Cohorts →</Link>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Pickup Queue</h2>
          <p className="mt-1 text-slate-600">Learners awaiting pickup assignments.</p>
          <Link href="/app/pickups" className="mt-2 inline-block text-xs text-slate-500 underline">Go to Pickups →</Link>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Review Backlog</h2>
          <p className="mt-1 text-slate-600">Submitted artifacts awaiting your verdict.</p>
          <Link href="/app/reviews" className="mt-2 inline-block text-xs text-slate-500 underline">Go to Reviews →</Link>
        </article>
      </div>
    </section>
  );
}
