"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
import CohortCard from "./CohortCard";

type DerivedCohort = {
  missionId: string;
  learnerCount: number;
};

const LEDGER_KEY = "rootwork.ledger.records";

function loadCohorts(): DerivedCohort[] {
  const records = localLedgerAdapter.readAll();
  const missionRecords = records.filter((r) => r.type === "mission");

  const byMission = new Map<string, Set<string>>();
  for (const r of missionRecords) {
    if (!byMission.has(r.missionId)) {
      byMission.set(r.missionId, new Set());
    }
    byMission.get(r.missionId)!.add(r.learnerId);
  }

  return Array.from(byMission.entries()).map(
    ([missionId, learners]) => ({ missionId, learnerCount: learners.size })
  );
}

function deleteCohortFromStorage(missionId: string): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(LEDGER_KEY);
  if (!raw) return;
  try {
    const all = JSON.parse(raw) as Array<{ missionId: string }>;
    const kept = all.filter((r) => r.missionId !== missionId);
    window.localStorage.setItem(LEDGER_KEY, JSON.stringify(kept));
  } catch {
    // ignore parse errors
  }
}

export default function CohortList() {
  const [cohorts, setCohorts] = useState<DerivedCohort[] | null>(null);
  const [cohortName, setCohortName] = useState("");
  const [learnerIds, setLearnerIds] = useState("");
  const [formStatus, setFormStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setCohorts(loadCohorts());
  }, []);

  const canSubmit = useMemo(
    () => cohortName.trim().length > 0 && learnerIds.trim().length > 0,
    [cohortName, learnerIds]
  );

  function handleCreate() {
    if (!cohortName.trim()) {
      setFormStatus({ type: "error", message: "Cohort name is required." });
      return;
    }
    const ids = learnerIds
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      setFormStatus({ type: "error", message: "At least one learner ID is required." });
      return;
    }
    const cohortId = `cohort.${cohortName.trim().toLowerCase().replace(/\s+/g, "-")}.${Date.now()}`;
    const now = new Date().toISOString();
    for (const learnerId of ids) {
      localLedgerAdapter.upsert({
        id: `${cohortId}.${learnerId}`,
        type: "mission",
        missionId: cohortId,
        learnerId,
        payload: { cohortName: cohortName.trim(), title: cohortName.trim() } as never,
        createdAtIso: now,
        updatedAtIso: now,
      });
    }
    setFormStatus({
      type: "success",
      message: `Cohort "${cohortName.trim()}" created with ${ids.length} learner${ids.length !== 1 ? "s" : ""}.`,
    });
    setCohortName("");
    setLearnerIds("");
    setCohorts(loadCohorts());
  }

  function handleDelete(missionId: string) {
    deleteCohortFromStorage(missionId);
    setCohorts(loadCohorts());
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Cohorts</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Manage your learner cohorts, track enrollment, and monitor cohort-level progress.
      </p>

      {/* Inline create form */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
        <h2 className="font-semibold text-slate-900">Create Cohort</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="new-cohort-name" className="block text-xs font-medium text-slate-700">
              Cohort Name
            </label>
            <input
              id="new-cohort-name"
              type="text"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Spring 2026 Cohort"
              value={cohortName}
              onChange={(e) => { setCohortName(e.target.value); setFormStatus(null); }}
            />
          </div>
          <div>
            <label htmlFor="new-cohort-learners" className="block text-xs font-medium text-slate-700">
              Learner IDs (one per line)
            </label>
            <textarea
              id="new-cohort-learners"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              placeholder={"user_abc123\nuser_def456"}
              value={learnerIds}
              onChange={(e) => { setLearnerIds(e.target.value); setFormStatus(null); }}
            />
          </div>
        </div>
        {formStatus && (
          <p className={`mt-2 text-xs ${formStatus.type === "success" ? "text-green-700" : "text-red-600"}`}>
            {formStatus.message}
          </p>
        )}
        <button
          type="button"
          onClick={handleCreate}
          disabled={!canSubmit}
          className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Create Cohort
        </button>
      </div>

      {/* Cohort list */}
      {cohorts === null && (
        <p className="text-sm text-slate-500">Loading cohort data…</p>
      )}

      {cohorts !== null && cohorts.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-800">No cohorts yet.</p>
          <p className="mt-1">Create one above or use the Builder to add missions and learners.</p>
          <Link href="/app/builder" className="mt-3 inline-block text-xs text-slate-500 underline">
            Go to Builder →
          </Link>
        </div>
      )}

      {cohorts !== null && cohorts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Active Cohorts ({cohorts.length})</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {cohorts.map((c) => (
              <div key={c.missionId} className="space-y-2">
                <CohortCard
                  name={c.missionId}
                  learnerCount={c.learnerCount}
                  status="active"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(c.missionId)}
                    className="rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete Cohort
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
