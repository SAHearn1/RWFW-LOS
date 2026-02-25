export default function MissionsList() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Missions</h1>
      <p className="text-sm text-slate-700">
        Track active missions, launch new learning cycles, and submit completed work for review.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Active Missions</h2>
          <p className="mt-1 text-slate-600">Your in-progress missions appear here. Start a mission to begin tracking progress.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Start a Mission</h2>
          <p className="mt-1 text-slate-600">Launch a new mission to set your learning intention and begin a structured cycle.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Submit for Review</h2>
          <p className="mt-1 text-slate-600">When work is complete, submit it to your facilitator for feedback and credit.</p>
        </article>
      </div>
      <p className="mt-4 text-sm text-slate-500">No missions yet. Begin your first learning cycle to get started.</p>
    </section>
  );
}
