import { Users } from "lucide-react";

type CohortStatus = "active" | "archived";

type MockCohort = {
  id: string;
  name: string;
  learnerCount: number;
  status: CohortStatus;
};

const MOCK_COHORTS: MockCohort[] = [
  { id: "cohort-1", name: "Spring 2026 Cohort A", learnerCount: 18, status: "active" },
  { id: "cohort-2", name: "Winter 2025 Intensive", learnerCount: 12, status: "archived" },
  { id: "cohort-3", name: "Self-Directed Summer", learnerCount: 7, status: "active" },
];

const STATUS_STYLES: Record<CohortStatus, string> = {
  active: "bg-teal-100 text-teal-800",
  archived: "bg-slate-100 text-slate-600",
};

export default function CohortsList() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900" data-tour="page-title">
            Cohorts
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your learner cohorts, track enrollment, and monitor cohort-level progress.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            disabled
            title="Coming soon"
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400"
          >
            <Users size={15} aria-hidden="true" />
            New Cohort
            <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-500">
              Coming soon
            </span>
          </button>
        </div>
      </div>

      <ul className="space-y-3" data-tour="cohorts-list">
        {MOCK_COHORTS.map((cohort) => (
          <li
            key={cohort.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Users size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium text-slate-900">{cohort.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {cohort.learnerCount} learner{cohort.learnerCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[cohort.status]}`}
              >
                {cohort.status}
              </span>
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                View
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
