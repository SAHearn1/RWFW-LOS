"use client";

import { useEffect, useState } from "react";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
import type { RuntimeArtifact } from "@/lib/runtime/contracts/types";
import ReviewCard from "./ReviewCard";

type ReviewItem = {
  id: string;
  artifactTitle: string;
  learnerName: string;
  submittedAt: string;
  flagged: boolean;
};

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export default function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const records = localLedgerAdapter.readAll();
    const artifactRecords = records.filter((r) => r.type === "artifact");

    const derived: ReviewItem[] = artifactRecords.map((r) => {
      const payload = r.payload as RuntimeArtifact;
      return {
        id: r.id,
        artifactTitle: payload.missionId
          ? `Artifact: Mission ${payload.missionId}`
          : "Untitled Artifact",
        learnerName: r.learnerId,
        submittedAt: formatDate(r.createdAtIso),
        flagged: false,
      };
    });

    setItems(derived);
    setLoaded(true);
  }, []);

  function handleApprove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleReturn(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleFlag(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, flagged: true } : item))
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Review Queue</h1>
      <p className="text-sm text-slate-700">
        Triage submitted artifacts. Approve, return for revision, or flag submissions needing
        attention.
      </p>

      {!loaded && <p className="text-sm text-slate-500">Loading review queue…</p>}

      {loaded && items.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-800">No artifacts pending review.</p>
          <p className="mt-1">
            Submissions appear here when learners save work in Studio.
          </p>
        </div>
      )}

      {loaded && items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <ReviewCard
              key={item.id}
              id={item.id}
              artifactTitle={item.artifactTitle}
              learnerName={item.learnerName}
              submittedAt={item.submittedAt}
              flagged={item.flagged}
              onApprove={handleApprove}
              onReturn={handleReturn}
              onFlag={handleFlag}
            />
          ))}
        </div>
      )}
    </section>
  );
}
