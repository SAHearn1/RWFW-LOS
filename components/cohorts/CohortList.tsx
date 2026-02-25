"use client";

import { useEffect, useState } from "react";
import { readAllCohorts, upsertCohort, deleteCohort, createCohort } from "@/lib/cohorts/store";
import type { CohortRecord } from "@/lib/cohorts/types";
import CohortCard from "./CohortCard";

export default function CohortList() {
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [newName, setNewName] = useState("");

  function loadCohorts() {
    setCohorts(readAllCohorts());
  }

  useEffect(() => {
    loadCohorts();
  }, []);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createCohort(trimmed);
    setNewName("");
    loadCohorts();
  }

  function handleUpdate(cohort: CohortRecord) {
    upsertCohort(cohort);
    loadCohorts();
  }

  function handleDelete(id: string) {
    deleteCohort(id);
    loadCohorts();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Cohorts</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Manage your learner cohorts, track enrollment, and monitor cohort-level progress.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="New cohort name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          type="button"
          className="rounded bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          onClick={handleCreate}
          disabled={!newName.trim()}
        >
          Create
        </button>
      </div>

      {cohorts.length === 0 ? (
        <p className="text-sm text-slate-500">No cohorts yet. Create one above.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {cohorts.map((cohort) => (
            <CohortCard
              key={cohort.id}
              cohort={cohort}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
