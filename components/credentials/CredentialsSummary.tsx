"use client";

import { useEffect, useMemo, useState } from "react";

import { localLedgerAdapter } from "@/lib/ledger/adapter";
import { phase3FeatureFlags } from "@/lib/config/featureFlags";
import type { LearnerTimelineItem } from "@/lib/timeline/learnerTimeline";

export default function CredentialsSummary() {
  const records = useMemo(() => {
    if (!phase3FeatureFlags.enableLedger) {
      return [];
    }

    return localLedgerAdapter.readAll();
  }, []);

  const [timeline, setTimeline] = useState<LearnerTimelineItem[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTimeline = async () => {
      try {
        const response = await fetch("/api/timeline/learner", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`timeline_request_failed_${response.status}`);
        }

        const payload = (await response.json()) as { timeline?: LearnerTimelineItem[] };
        if (!active) {
          return;
        }

        setTimeline(payload.timeline ?? []);
      } catch (error) {
        if (!active) {
          return;
        }

        setTimelineError(error instanceof Error ? error.message : "timeline_request_failed");
      }
    };

    loadTimeline();
    return () => {
      active = false;
    };
  }, []);

  const verificationCount = records.filter((record) => record.type === "verification").length;
  const artifactCount = records.filter((record) => record.type === "artifact").length;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Credentials</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Evidence and verification summary for the active learner workspace.
      </p>
      {!phase3FeatureFlags.enableLedger ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ledger is disabled. Enable `NEXT_PUBLIC_ENABLE_LEDGER` to view credential evidence.
        </p>
      ) : null}
      <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="grid grid-cols-[180px_1fr] gap-3">
          <dt className="font-medium text-slate-600">Artifacts Saved</dt>
          <dd>{artifactCount}</dd>
        </div>
        <div className="grid grid-cols-[180px_1fr] gap-3">
          <dt className="font-medium text-slate-600">Verifications Recorded</dt>
          <dd>{verificationCount}</dd>
        </div>
      </dl>

      <section className="space-y-3" data-tour="learner-timeline">
        <h2 className="text-lg font-semibold text-slate-900">Progress Timeline</h2>
        <p className="text-sm text-slate-600">Recent mission, artifact, and verification events for this learner.</p>

        {timelineError ? (
          <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Timeline unavailable ({timelineError}).
          </p>
        ) : timeline.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            No timeline events found yet.
          </div>
        ) : (
          <ol className="space-y-2">
            {timeline.slice(0, 20).map((item) => (
              <li key={item.id} className="rounded border border-slate-200 bg-white p-3 text-sm">
                <p className="font-medium text-slate-900">{item.summary}</p>
                <p className="text-xs text-slate-500">{new Date(item.occurredAtIso).toLocaleString()} | {item.missionId}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}
