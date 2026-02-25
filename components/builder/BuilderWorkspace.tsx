"use client";

export default function BuilderWorkspace() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Builder</h1>
      <p className="text-sm text-slate-700">Create missions and cohorts for your learners.</p>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-semibold text-slate-900">Mission Builder</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="mission-title" className="block text-xs font-medium text-slate-700">
                Mission Title
              </label>
              <input
                id="mission-title"
                type="text"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Enter mission title"
              />
            </div>
            <div>
              <label htmlFor="mission-objective" className="block text-xs font-medium text-slate-700">
                Objective
              </label>
              <textarea
                id="mission-objective"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                rows={4}
                placeholder="Describe the mission objective"
              />
            </div>
            <button
              type="button"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Create Mission
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-semibold text-slate-900">Cohort Builder</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="cohort-name" className="block text-xs font-medium text-slate-700">
                Cohort Name
              </label>
              <input
                id="cohort-name"
                type="text"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Enter cohort name"
              />
            </div>
            <div>
              <label htmlFor="cohort-learners" className="block text-xs font-medium text-slate-700">
                Learner IDs (one per line)
              </label>
              <textarea
                id="cohort-learners"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                rows={4}
                placeholder="learner-id-1&#10;learner-id-2&#10;learner-id-3"
              />
            </div>
            <button
              type="button"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Create Cohort
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
