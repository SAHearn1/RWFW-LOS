"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

type ApiMember = {
  userId: string;
  identifier: string;
  role: string;
  joinedAt: string;
};

type ApiCohort = {
  orgId: string;
  name: string;
  members: ApiMember[];
};

type ApiResponse = {
  cohorts: ApiCohort[];
};

const STATUS_STYLES = {
  active: "bg-teal-100 text-teal-800",
  archived: "bg-slate-100 text-slate-600",
} as const;

export default function CohortsList() {
  const [cohorts, setCohorts] = useState<ApiCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCohorts() {
      try {
        const res = await fetch("/api/cohorts");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: ApiResponse = await res.json() as ApiResponse;
        if (!cancelled) {
          setCohorts(data.cohorts ?? []);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchCohorts();

    return () => {
      cancelled = true;
    };
  }, []);

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

      {loading && (
        <p className="text-sm text-slate-500" role="status" aria-live="polite">
          Loading cohorts…
        </p>
      )}

      {!loading && error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Unable to load cohorts. Please try again later.
        </p>
      )}

      {!loading && !error && cohorts.length === 0 && (
        <p className="text-sm text-slate-500">No cohorts found.</p>
      )}

      {!loading && !error && cohorts.length > 0 && (
        <ul className="space-y-3" data-tour="cohorts-list">
          {cohorts.map((cohort) => {
            const memberCount = cohort.members.length;
            return (
              <li
                key={cohort.orgId}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Users size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{cohort.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {memberCount} learner{memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES.active}`}
                  >
                    active
                  </span>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    View
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
