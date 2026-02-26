"use client";

import { useState } from "react";
import { CheckCircle, RotateCcw, AlertTriangle, X } from "lucide-react";

type Verdict = "approve" | "return" | "flag";

type ReviewItem = {
  id: string;
  learnerName: string;
  missionTitle: string;
  artifactPreview: string;
  submittedDate: string;
};

const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    learnerName: "Alex Rivera",
    missionTitle: "Define Your Why",
    artifactPreview:
      "My mission is rooted in serving the community by bridging the gap between formal education and real-world application. I believe that learning should be purposeful and connected to...",
    submittedDate: "Feb 24, 2026",
  },
  {
    id: "rev-2",
    learnerName: "Jordan Lee",
    missionTitle: "Map Your Strengths",
    artifactPreview:
      "Through this artifact I explored how systems thinking applies to personal growth. The feedback loops I identified in my own learning process have reshaped how I approach...",
    submittedDate: "Feb 23, 2026",
  },
  {
    id: "rev-3",
    learnerName: "Sam Patel",
    missionTitle: "Identify Learning Pathways",
    artifactPreview:
      "I mapped three distinct pathways that align with my long-term goals. Each pathway includes specific milestones, accountability checkpoints, and reflection prompts designed to...",
    submittedDate: "Feb 22, 2026",
  },
];

const VERDICT_LABEL: Record<Verdict, string> = {
  approve: "Approved",
  return: "Returned for revision",
  flag: "Flagged for follow-up",
};

type Toast = {
  id: string;
  message: string;
};

export default function ReviewQueue() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function recordVerdict(itemId: string, verdict: Verdict, learnerName: string) {
    const message = `${VERDICT_LABEL[verdict]} — ${learnerName}`;
    const toastId = `${itemId}-${verdict}-${Date.now()}`;
    setToasts((prev) => [...prev, { id: toastId, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  }

  function dismissToast(toastId: string) {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
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

      <div className="space-y-4" data-tour="review-queue">
        {MOCK_REVIEWS.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.learnerName}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Mission: <span className="font-medium">{item.missionTitle}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Submitted {item.submittedDate}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600 italic">
                &ldquo;{item.artifactPreview}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => recordVerdict(item.id, "approve", item.learnerName)}
                className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <CheckCircle size={14} aria-hidden="true" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => recordVerdict(item.id, "return", item.learnerName)}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
              >
                <RotateCcw size={14} aria-hidden="true" />
                Return
              </button>
              <button
                type="button"
                onClick={() => recordVerdict(item.id, "flag", item.learnerName)}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                <AlertTriangle size={14} aria-hidden="true" />
                Flag
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Live submissions will populate from the ledger when enabled. Verdict actions are UI-only in this phase.
      </p>
    </section>
  );
}
