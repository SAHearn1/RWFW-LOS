"use client";

import { phase3FeatureFlags } from "@/lib/config/featureFlags";

export default function SettingsHealth() {
  const localStorageReady = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Settings Health</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">Operational checks for runtime and feature readiness.</p>
      <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Local Storage</dt><dd>{localStorageReady ? "ready" : "unavailable"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Runtime Flag</dt><dd>{phase3FeatureFlags.enableRuntime ? "enabled" : "disabled"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Ledger Flag</dt><dd>{phase3FeatureFlags.enableLedger ? "enabled" : "disabled"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Standards Verifier Flag</dt><dd>{phase3FeatureFlags.enableStandardsVerifier ? "enabled" : "disabled"}</dd></div>
      </dl>
    </section>
  );
}
