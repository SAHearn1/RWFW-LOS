"use client";

import { useEffect, useState } from "react";

import { readAllCohorts } from "@/lib/cohorts/store";
import { readAllVerdicts } from "@/lib/reviews/store";

export default function TeacherHome() {
  const [pendingReviews, setPendingReviews] = useState(0);
  const [activeCohorts, setActiveCohorts] = useState(0);
  const [totalLearners, setTotalLearners] = useState(0);

  useEffect(() => {
    const verdicts = readAllVerdicts();
    setPendingReviews(verdicts.filter((r) => r.verdict === null).length);

    const cohorts = readAllCohorts();
    const active = cohorts.filter((c) => c.status === "active");
    setActiveCohorts(active.length);
    setTotalLearners(active.reduce((sum, c) => sum + c.learnerIds.length, 0));
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Home (Teacher)</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Coordinate learner interventions, monitor review queues, and keep cohort progress moving.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="teacher-intervention-card">
          <h2 className="font-semibold text-slate-900">Intervention Queue</h2>
          <p className="mt-1 text-slate-600">Prioritize learner support from deterministic urgency signals.</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{totalLearners}</p>
          <p className="text-xs text-slate-500">learners across active cohorts</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="teacher-cohort-card">
          <h2 className="font-semibold text-slate-900">Cohort Flow</h2>
          <p className="mt-1 text-slate-600">Track cohort pacing and unblock missions with targeted actions.</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{activeCohorts}</p>
          <p className="text-xs text-slate-500">active cohorts</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="teacher-reviews-card">
          <h2 className="font-semibold text-slate-900">Evidence Reviews</h2>
          <p className="mt-1 text-slate-600">Review submitted artifacts and verification outcomes in one loop.</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{pendingReviews}</p>
          <p className="text-xs text-slate-500">pending reviews</p>
        </article>
      </div>
    </section>
  );
}
