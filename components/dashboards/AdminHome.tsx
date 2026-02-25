export default function AdminHome() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Admin)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Govern the platform — configure standards, inspect evidence, and manage export readiness.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Standards Registry</h2>
          <p className="mt-1 text-slate-600">
            Review active standards, verification rules, and plugin configuration across the system.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Evidence Volume</h2>
          <p className="mt-1 text-slate-600">
            Inspect the ledger — artifact submissions, verification events, and learner records.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Export Readiness</h2>
          <p className="mt-1 text-slate-600">
            Check data export status, compliance flags, and readiness summaries for governance reporting.
          </p>
        </article>
      </div>
    </section>
  );
}
