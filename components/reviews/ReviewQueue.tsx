"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, RotateCcw, AlertTriangle, X } from "lucide-react";

type ApiVerdict = "pending" | "approved" | "returned" | "flagged";
type PostVerdict = "approved" | "returned" | "flagged";

type ReviewItem = {
  id: string;
  missionId: string;
  learnerId: string;
  artifactPreview: string;
  submittedAtIso: string;
  verdict: ApiVerdict;
};

const VERDICT_LABEL: Record<PostVerdict, string> = {
  approved: "Approved",
  returned: "Returned for revision",
  flagged: "Flagged for follow-up",
};

type Toast = {
  id: string;
  message: string;
};

export default function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews");
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { items: ReviewItem[] };
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  async function recordVerdict(itemId: string, verdict: PostVerdict) {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, verdict }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const message = VERDICT_LABEL[verdict];
      const toastId = `${itemId}-${verdict}-${Date.now()}`;
      setToasts((prev) => [...prev, { id: toastId, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 4000);
      // Refresh the list to reflect updated verdicts
      await fetchItems();
    } catch (err) {
      const toastId = `err-${Date.now()}`;
      const message = err instanceof Error ? err.message : "Verdict submission failed";
      setToasts((prev) => [...prev, { id: toastId, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 4000);
    }
  }

  function dismissToast(toastId: string) {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }

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

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900" data-tour="page-title">
          Reviews
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Triage submitted artifacts. Approve, return for revision, or flag submissions needing attention.
        </p>
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 shadow-md"
            >
              <CheckCircle size={16} className="shrink-0 text-teal-600" aria-hidden="true" />
              <p className="text-sm font-medium text-teal-800">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="ml-2 text-teal-500 hover:text-teal-700"
                aria-label="Dismiss notification"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500" role="status">
          Loading reviews…
        </p>
      )}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">No submitted artifacts to review.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-4" data-tour="review-queue">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      Learner <span className="font-mono text-xs text-slate-500">{item.learnerId.slice(0, 12)}…</span>
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      Mission: <span className="font-medium font-mono text-xs">{item.missionId}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Submitted {formatDate(item.submittedAtIso)}
                    </p>
                  </div>
                  {item.verdict !== "pending" && (
                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize
                      data-[v=approved]:border-teal-300 data-[v=approved]:bg-teal-50 data-[v=approved]:text-teal-700
                      data-[v=returned]:border-amber-300 data-[v=returned]:bg-amber-50 data-[v=returned]:text-amber-700
                      data-[v=flagged]:border-red-300 data-[v=flagged]:bg-red-50 data-[v=flagged]:text-red-700"
                      data-v={item.verdict}
                    >
                      {item.verdict}
                    </span>
                  )}
                </div>
                {item.artifactPreview && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600 italic">
                    &ldquo;{item.artifactPreview}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
                <button
                  type="button"
                  onClick={() => void recordVerdict(item.id, "approved")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  <CheckCircle size={14} aria-hidden="true" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void recordVerdict(item.id, "returned")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Return
                </button>
                <button
                  type="button"
                  onClick={() => void recordVerdict(item.id, "flagged")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                >
                  <AlertTriangle size={14} aria-hidden="true" />
                  Flag
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Showing up to 50 most recent submissions from the ledger. Verdict actions are persisted immediately.
      </p>
    </section>
  );
}
