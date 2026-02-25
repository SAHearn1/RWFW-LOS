"use client";

import type { ReviewRecord, ReviewVerdict } from "@/lib/reviews/types";

type ReviewCardProps = {
  record: ReviewRecord;
  onVerdict: (verdict: ReviewVerdict) => void;
};

const VERDICT_STYLES: Record<ReviewVerdict, string> = {
  approved: "bg-green-100 text-green-800",
  returned: "bg-amber-100 text-amber-800",
  flagged: "bg-red-100 text-red-800",
};

export default function ReviewCard({ record, onVerdict }: ReviewCardProps) {
  const preview =
    record.contentPreview.length > 200
      ? record.contentPreview.slice(0, 200) + "…"
      : record.contentPreview;

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">Learner: {record.learnerId || "unknown"}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Artifact {record.artifactId} · Mission {record.missionId}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Saved {record.savedAtIso ? new Date(record.savedAtIso).toLocaleDateString() : "—"}
          </p>
        </div>
        {record.verdict !== null && (
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${VERDICT_STYLES[record.verdict]}`}
          >
            {record.verdict}
          </span>
        )}
      </div>

      {preview && (
        <p className="mt-2 rounded border border-slate-100 bg-white p-2 text-xs text-slate-700 leading-relaxed">
          {preview}
        </p>
      )}

      {record.verdict === null ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
            onClick={() => onVerdict("approved")}
          >
            Approve
          </button>
          <button
            type="button"
            className="rounded border border-amber-400 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
            onClick={() => onVerdict("returned")}
          >
            Return
          </button>
          <button
            type="button"
            className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            onClick={() => onVerdict("flagged")}
          >
            Flag
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Reviewed {record.reviewedAtIso ? new Date(record.reviewedAtIso).toLocaleDateString() : "—"}
        </p>
      )}
    </article>
  );
}
