"use client";

import { useState } from "react";

function buildEmptyMission() {
  return { title: "", objective: "" };
}

function buildEmptyCohort() {
  return { name: "", learners: "" };
}

export default function BuilderWorkspace() {
  const [mission, setMission] = useState(buildEmptyMission());
  const [cohort, setCohort] = useState(buildEmptyCohort());
  const [missionStatus, setMissionStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [cohortStatus, setCohortStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function handleCreateMission() {
    if (!mission.title.trim()) {
      setMissionStatus({ type: "error", message: "Mission title is required." });
      return;
    }
    setMissionStatus({ type: "success", message: `Mission "${mission.title.trim()}" created. It will appear in your learners' mission lists.` });
    setMission(buildEmptyMission());
  }

  function handleCreateCohort() {
    if (!cohort.name.trim()) {
      setCohortStatus({ type: "error", message: "Cohort name is required." });
      return;
    }
    const learnerIds = cohort.learners
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (learnerIds.length === 0) {
      setCohortStatus({ type: "error", message: "At least one learner ID is required." });
      return;
    }
    setCohortStatus({
      type: "success",
      message: `Cohort "${cohort.name.trim()}" created with ${learnerIds.length} learner${learnerIds.length !== 1 ? "s" : ""}.`,
    });
    setCohort(buildEmptyCohort());
  }

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
                value={mission.title}
                onChange={(e) => { setMission({ ...mission, title: e.target.value }); setMissionStatus(null); }}
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
                value={mission.objective}
                onChange={(e) => { setMission({ ...mission, objective: e.target.value }); setMissionStatus(null); }}
              />
            </div>
            {missionStatus && (
              <p className={`text-xs ${missionStatus.type === "success" ? "text-green-700" : "text-red-600"}`}>
                {missionStatus.message}
              </p>
            )}
            <button
              type="button"
              onClick={handleCreateMission}
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
                value={cohort.name}
                onChange={(e) => { setCohort({ ...cohort, name: e.target.value }); setCohortStatus(null); }}
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
                placeholder={"learner-id-1\nlearner-id-2\nlearner-id-3"}
                value={cohort.learners}
                onChange={(e) => { setCohort({ ...cohort, learners: e.target.value }); setCohortStatus(null); }}
              />
            </div>
            {cohortStatus && (
              <p className={`text-xs ${cohortStatus.type === "success" ? "text-green-700" : "text-red-600"}`}>
                {cohortStatus.message}
              </p>
            )}
            <button
              type="button"
              onClick={handleCreateCohort}
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
