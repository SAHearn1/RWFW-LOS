"use client";

import { useState } from "react";
import type { CohortRecord } from "@/lib/cohorts/types";

type CohortCardProps = {
  cohort: CohortRecord;
  onUpdate: (cohort: CohortRecord) => void;
  onDelete: (id: string) => void;
};

const STATUS_COLORS: Record<CohortRecord["status"], string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
};

export default function CohortCard({ cohort, onUpdate, onDelete }: CohortCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [memberInput, setMemberInput] = useState(cohort.learnerIds.join(", "));

  function handleSaveMembers() {
    const learnerIds = memberInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onUpdate({ ...cohort, learnerIds });
  }

  const learnerCount = cohort.learnerIds.length;

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="flex items-start justify-between">
        <h2 className="font-semibold text-slate-900">{cohort.name}</h2>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[cohort.status]}`}>
          {cohort.status}
        </span>
      </div>
      <p className="mt-1 text-slate-600">
        {learnerCount} learner{learnerCount !== 1 ? "s" : ""}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Hide Members" : "Manage Members"}
        </button>
        <button
          type="button"
          className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          onClick={() => onDelete(cohort.id)}
        >
          Delete
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs text-slate-600" htmlFor={`members-${cohort.id}`}>
            Learner IDs (comma-separated)
          </label>
          <textarea
            id={`members-${cohort.id}`}
            className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            rows={3}
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            placeholder="learner_001, learner_002, ..."
          />
          <button
            type="button"
            className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
            onClick={handleSaveMembers}
          >
            Save
          </button>
        </div>
      )}
    </article>
  );
}
