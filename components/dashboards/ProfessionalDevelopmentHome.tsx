export default function ProfessionalDevelopmentHome() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Professional Development)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Coordinate professional learning, review evidence, and move cohorts through targeted growth cycles.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Session Pipeline</h2>
          <p className="mt-1 text-slate-600">Plan and stage upcoming professional development sessions.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Facilitator Reviews</h2>
          <p className="mt-1 text-slate-600">Triage submissions and route high-priority reviews to teams.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Cohort Health</h2>
          <p className="mt-1 text-slate-600">Monitor cohorts, pickups, and readiness indicators in one loop.</p>
        </article>
      </div>
    </section>
  );
}