"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { phase1FeatureFlags } from "@/lib/config/featureFlags";
import type { LedgerRecord } from "@/lib/ledger/adapter";

type LoadState = "loading" | "ready" | "error";

export default function PortfolioView() {
  const ledgerEnabled = phase1FeatureFlags.enableLedger;

  const [artifacts, setArtifacts] = useState<LedgerRecord[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!ledgerEnabled) {
      setLoadState("ready");
      return;
    }
    fetchArtifacts();
  }, [ledgerEnabled]);

  async function fetchArtifacts() {
    setLoadState("loading");
    try {
      const res = await fetch("/api/ledger/records");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { records: LedgerRecord[] };
      const artifactRecords = data.records.filter(r => r.type === "artifact");
      setArtifacts(artifactRecords);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  function getArtifactPreview(record: LedgerRecord): string {
    const payload = record.payload as Record<string, unknown>;
    if (typeof payload.content === "string") {
      const content = payload.content.trim();
      return content.length > 120 ? content.slice(0, 120) + "…" : content;
    }
    return "(no preview available)";
  }

  if (!ledgerEnabled) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold" data-tour="page-title">Portfolio</h1>
        <p className="text-sm text-slate-700">
          Your evidence portfolio — saved artifacts, verification results, and credential progress.
        </p>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Portfolio is enabled when <code className="font-mono">NEXT_PUBLIC_ENABLE_LEDGER=true</code>.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Portfolio</h1>
      <p className="text-sm text-slate-700">
        Your evidence portfolio — saved artifacts, verification results, and credential progress.
      </p>

      {loadState === "loading" && (
        <p className="text-sm text-slate-500">Loading portfolio…</p>
      )}

      {loadState === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load portfolio records.{" "}
          <button
            type="button"
            onClick={fetchArtifacts}
            className="underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {loadState === "ready" && artifacts.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
          <p>Save an artifact in Studio to build your portfolio.</p>
          <Link
            href="/app/studio"
            className="mt-2 inline-block text-sky-600 underline hover:no-underline"
          >
            Go to Studio
          </Link>
        </div>
      )}

      {loadState === "ready" && artifacts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {artifacts.map(record => (
            <article
              key={record.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"
            >
              <p className="text-slate-800 break-words">{getArtifactPreview(record)}</p>
              <p className="mt-2 text-xs text-slate-500">
                Mission: <span className="font-medium">{record.missionId}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{record.createdAtIso.slice(0, 10)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
