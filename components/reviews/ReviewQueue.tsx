"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReviewRecord, ReviewVerdict } from "@/lib/reviews/types";
import { readAllVerdicts, saveVerdict } from "@/lib/reviews/store";
import ReviewCard from "./ReviewCard";

type LedgerRecordRaw = {
  id: string;
  type: string;
  missionId: string;
  learnerId: string;
  payload: unknown;
  createdAtIso: string;
  updatedAtIso: string;
};

function mapLedgerToReview(
  raw: LedgerRecordRaw,
  storedVerdicts: Map<string, ReviewRecord>
): ReviewRecord {
  const stored = storedVerdicts.get(raw.id);
  const payloadRecord = raw.payload as Record<string, unknown>;
  const contentPreview =
    typeof payloadRecord?.content === "string" ? payloadRecord.content : "";

  return {
    id: raw.id,
    artifactId: raw.id,
    learnerId: raw.learnerId,
    missionId: raw.missionId,
    contentPreview,
    savedAtIso: raw.updatedAtIso,
    verdict: stored?.verdict ?? null,
    reviewedAtIso: stored?.reviewedAtIso ?? null,
  };
}

export default function ReviewQueue() {
  const [pending, setPending] = useState<ReviewRecord[]>([]);
  const [reviewed, setReviewed] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ledger/records");

      if (!res.ok) {
        if (res.status === 503) {
          setError("Ledger not enabled. Set NEXT_PUBLIC_ENABLE_DB_LEDGER=true to load submissions.");
        } else if (res.status === 403) {
          setError("Access denied. Facilitator role required.");
        } else {
          setError(`Failed to load submissions (${res.status}).`);
        }
        setPending([]);
        setReviewed([]);
        return;
      }

      const data = (await res.json()) as { records: LedgerRecordRaw[] };
      const artifactRecords = (data.records ?? []).filter((r) => r.type === "artifact");

      const storedVerdicts = new Map<string, ReviewRecord>(
        readAllVerdicts().map((v) => [v.artifactId, v])
      );

      const all = artifactRecords.map((r) => mapLedgerToReview(r, storedVerdicts));
      setPending(all.filter((r) => r.verdict === null));
      setReviewed(all.filter((r) => r.verdict !== null));
    } catch {
      setError("Network error while loading submissions.");
      setPending([]);
      setReviewed([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  function handleVerdict(artifactId: string, verdict: ReviewVerdict) {
    saveVerdict(artifactId, verdict);
    void loadReviews();
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

      {loading && (
        <p className="text-sm text-slate-500">Loading submissions&hellip;</p>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {!loading && !error && pending.length === 0 && reviewed.length === 0 && (
        <p className="text-sm text-slate-500">No submissions pending review.</p>
      )}

      {!loading && !error && pending.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Pending ({pending.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map((record) => (
              <ReviewCard
                key={record.id}
                record={record}
                onVerdict={(verdict) => handleVerdict(record.artifactId, verdict)}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && reviewed.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">
            Reviewed ({reviewed.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2 opacity-75">
            {reviewed.map((record) => (
              <ReviewCard
                key={record.id}
                record={record}
                onVerdict={(verdict) => handleVerdict(record.artifactId, verdict)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
