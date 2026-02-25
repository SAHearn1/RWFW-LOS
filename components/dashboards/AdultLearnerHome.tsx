export default function AdultLearnerHome() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Adult Learner)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Focus your independent adult learning pathway with practical missions and portfolio-ready artifacts.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="mission-draft">
          <h2 className="font-semibold text-slate-900">Current Goal</h2>
          <p className="mt-1 text-slate-600">Define this week&apos;s applied objective and launch a mission cycle.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="studio-entry">
          <h2 className="font-semibold text-slate-900">Artifact Studio</h2>
          <p className="mt-1 text-slate-600">Convert your mission output into a polished artifact with evidence notes.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="verification-summary">
          <h2 className="font-semibold text-slate-900">Progress Signals</h2>
          <p className="mt-1 text-slate-600">Track readiness and credential progress as your portfolio evolves.</p>
        </article>
      </div>
    </section>
  );
}