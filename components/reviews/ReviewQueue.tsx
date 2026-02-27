"use client";

import { useEffect, useState } from "react";
import { isDbLedgerFlagEnabled } from "@/lib/ledger/flags";
import { localLedgerAdapter } from "@/lib/ledger/adapter";
import type { RuntimeArtifact } from "@/lib/runtime/contracts/types";
import ReviewCard from "./ReviewCard";

type ReviewItem = {
  id: string;
  missionId: string;
  learnerId: string;
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

async function fetchLedgerRecords(): Promise<ReviewItem[]> {
  if (isDbLedgerFlagEnabled()) {
    try {
      const res = await fetch("/api/ledger/records");
      if (res.ok) {
        const data = (await res.json()) as { records?: unknown[] };
        const records = data.records ?? [];
        return records
          .filter(
            (r): r is Record<string, unknown> =>
              !!r && typeof r === "object" && (r as Record<string, unknown>).type === "artifact"
          )
          .map((r) => {
            const payload = (r.payload ?? {}) as RuntimeArtifact;
            return {
              id: r.id as string,
              missionId: payload.missionId ?? (r.missionId as string) ?? "",
              learnerId: (r.learnerId as string) ?? "",
              artifactTitle: payload.missionId
                ? `Artifact: Mission ${payload.missionId}`
                : "Untitled Artifact",
              learnerName: (r.learnerId as string) ?? "Unknown",
              submittedAt: formatDate((r.createdAtIso as string) ?? ""),
              flagged: false,
            };
          });
      }
    } catch {
      // fall through to local adapter
    }
  }

  const records = localLedgerAdapter.readAll();
  return records
    .filter((r) => r.type === "artifact")
    .map((r) => {
      const payload = r.payload as RuntimeArtifact;
      return {
        id: r.id,
        missionId: payload.missionId ?? r.missionId,
        learnerId: r.learnerId,
        artifactTitle: payload.missionId
          ? `Artifact: Mission ${payload.missionId}`
          : "Untitled Artifact",
        learnerName: r.learnerId,
        submittedAt: formatDate(r.createdAtIso),
        flagged: false,
      };
    });
}

async function approveMission(learnerId: string, missionId: string): Promise<void> {
  try {
    const getRes = await fetch(
      `/api/runtime/state?learnerId=${encodeURIComponent(learnerId)}`
    );
    if (!getRes.ok) return;

    const { state } = (await getRes.json()) as { state?: Record<string, unknown> };
    if (!state) return;

    const missions = (state.missions ?? {}) as Record<string, Record<string, unknown>>;
    if (!missions[missionId]) return;

    missions[missionId] = {
      ...missions[missionId],
      stage: "verified",
      updatedAtIso: new Date().toISOString(),
    };

    await fetch("/api/runtime/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ learnerId, state: { ...state, missions } }),
    });
  } catch {
    // Non-fatal: approval UI still removes the item from the queue.
  }
}

export default function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchLedgerRecords()
      .then((derived) => {
        setItems(derived);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleApprove(id: string) {
    const item = items.find((i) => i.id === id);
    if (item) {
      await approveMission(item.learnerId, item.missionId);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
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
      <h1 className="text-2xl font-semibold" data-tour="page-title">
        Review Queue
      </h1>
      <p className="text-sm text-slate-700">
        Triage submitted artifacts. Approve, return for revision, or flag submissions needing
        attention.
      </p>

      {!loaded && <p className="text-sm text-slate-500">Loading review queue…</p>}

      {loaded && items.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-800">No artifacts pending review.</p>
          <p className="mt-1">Submissions appear here when learners save work in Studio.</p>
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
