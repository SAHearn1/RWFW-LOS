import CohortCard from "./CohortCard";

export default function CohortList() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Cohorts</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Manage your learner cohorts, track enrollment, and monitor cohort-level progress.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <CohortCard name="Demo Cohort A" learnerCount={12} status="active" />
        <CohortCard name="Demo Cohort B" learnerCount={8} status="pending" />
        <CohortCard name="Spring Cohort" learnerCount={20} status="completed" />
      </div>
      <p className="mt-4 text-xs text-slate-400">Cohort data will populate from your assigned groups. Use Builder to create new cohorts.</p>
    </section>
  );
}
