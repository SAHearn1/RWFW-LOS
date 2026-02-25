export default function TeacherHome() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Teacher)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Manage your cohorts, review learner artifacts, and coordinate next actions from one operational view.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Command Center</h2>
          <p className="mt-1 text-slate-600">
            Active cohorts, pickup queue, and review backlog — your real-time operational snapshot.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Review Queue</h2>
          <p className="mt-1 text-slate-600">
            Triage submitted artifacts. Approve, return, or flag work from learners across your cohorts.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Active Cohorts</h2>
          <p className="mt-1 text-slate-600">
            Track learner progress, pickup assignments, and cohort health indicators at a glance.
          </p>
        </article>
      </div>
    </section>
  );
}
