"use client";

import { useEffect, useState } from "react";

import DataRetentionPanel from "@/components/settings/DataRetentionPanel";
import { phase3FeatureFlags, phase1FeatureFlags } from "@/lib/config/featureFlags";

type FlagServiceStatus = "unknown" | "ready" | "disabled" | "error" | "unavailable";

type AiHealthPayload = {
  localOllama?: string;
  cloudManaged?: string;
  federation?: string;
  discoveryCount?: number;
};

export default function SettingsHealth() {
  const localStorageReady = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  const [exportState, setExportState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [mcpStatus, setMcpStatus] = useState<FlagServiceStatus>("unknown");
  const [offlineStatus, setOfflineStatus] = useState<FlagServiceStatus>("unknown");
  const [localOllamaStatus, setLocalOllamaStatus] = useState<FlagServiceStatus>("unknown");
  const [cloudManagedStatus, setCloudManagedStatus] = useState<FlagServiceStatus>("unknown");
  const [federationStatus, setFederationStatus] = useState<FlagServiceStatus>("unknown");
  const [federationDiscoveryCount, setFederationDiscoveryCount] = useState<number>(0);

  useEffect(() => {
    const loadStatuses = async () => {
      const check = async (url: string): Promise<FlagServiceStatus> => {
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (response.ok) {
            return "ready";
          }

          if (response.status === 503) {
            return "disabled";
          }

          return "error";
        } catch {
          return "error";
        }
      };

      const [mcp, offline] = await Promise.all([
        check("/api/mcp/health"),
        check("/api/offline/status")
      ]);

      setMcpStatus(mcp);
      setOfflineStatus(offline);

      try {
        const response = await fetch("/api/ai/health", { cache: "no-store" });
        if (!response.ok) {
          setLocalOllamaStatus("error");
          setCloudManagedStatus("error");
          setFederationStatus("error");
          return;
        }

        const payload = (await response.json()) as AiHealthPayload;
        setLocalOllamaStatus((payload.localOllama as FlagServiceStatus) ?? "unknown");
        setCloudManagedStatus((payload.cloudManaged as FlagServiceStatus) ?? "unknown");
        setFederationStatus((payload.federation as FlagServiceStatus) ?? "unknown");
        setFederationDiscoveryCount(payload.discoveryCount ?? 0);
      } catch {
        setLocalOllamaStatus("error");
        setCloudManagedStatus("error");
        setFederationStatus("error");
      }
    };

    void loadStatuses();
  }, []);

  const exportDiagnostics = async () => {
    try {
      setExportState("working");
      const response = await fetch("/api/support/diagnostics", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`support_diagnostics_${response.status}`);
      }

      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      anchor.href = url;
      anchor.download = `rootwork-support-diagnostics-${timestamp}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      setExportState("done");
    } catch {
      setExportState("error");
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Settings Health</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">Operational checks for runtime and feature readiness.</p>
      <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Local Storage</dt><dd>{localStorageReady ? "ready" : "unavailable"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Runtime Flag</dt><dd>{phase3FeatureFlags.enableRuntime ? "enabled" : "disabled"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Ledger Flag</dt><dd>{phase3FeatureFlags.enableLedger ? "enabled" : "disabled"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Standards Verifier Flag</dt><dd>{phase3FeatureFlags.enableStandardsVerifier ? "enabled" : "disabled"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">MCP Flag</dt><dd>{phase1FeatureFlags.enableMcp ? "enabled" : "disabled"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">MCP Service</dt><dd>{mcpStatus}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Offline Flag</dt><dd>{phase1FeatureFlags.enableOffline ? "enabled" : "disabled"}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Offline Service</dt><dd>{offlineStatus}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Local Ollama</dt><dd>{localOllamaStatus}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Cloud Managed</dt><dd>{cloudManagedStatus}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Federation</dt><dd>{federationStatus}</dd></div>
        <div className="grid grid-cols-[220px_1fr] gap-3"><dt className="font-medium text-slate-600">Federation Discovery</dt><dd>{federationDiscoveryCount}</dd></div>
      </dl>

      <section className="rounded-lg border border-slate-200 bg-white p-4" data-tour="support-diagnostics">
        <h2 className="text-lg font-semibold text-slate-900">Support Diagnostics</h2>
        <p className="mt-1 text-sm text-slate-600">
          Download a redacted diagnostics bundle for support triage (flags, verifier snapshots, and env presence only).
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={exportDiagnostics}
            disabled={exportState === "working"}
          >
            {exportState === "working" ? "Exporting..." : "Download Diagnostics"}
          </button>
          {exportState === "done" ? <p className="text-xs text-emerald-700">Diagnostics export generated.</p> : null}
          {exportState === "error" ? <p className="text-xs text-rose-700">Diagnostics export failed.</p> : null}
        </div>
      </section>

      <DataRetentionPanel />
    </section>
  );
}
