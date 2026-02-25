import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { phase1FeatureFlags, phase3FeatureFlags } from "@/lib/config/featureFlags";

type JsonObject = Record<string, unknown>;

const ENV_KEYS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "NEXT_PUBLIC_ENABLE_RUNTIME",
  "NEXT_PUBLIC_ENABLE_LEDGER",
  "NEXT_PUBLIC_ENABLE_DB_LEDGER",
  "NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER",
  "NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA",
  "NEXT_PUBLIC_ENABLE_FEDERATION",
  "ROOTWORK_TELEMETRY_INGEST_TOKEN"
] as const;

function readJsonIfExists(path: string): JsonObject | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
  } catch {
    return null;
  }
}

export function createSupportDiagnosticsBundle() {
  const releaseGate = readJsonIfExists(resolve("docs", "status", "release-gate-latest.json"));
  const syntheticSmoke = readJsonIfExists(resolve("docs", "status", "synthetic-smoke-latest.json"));
  const consistency = readJsonIfExists(resolve("docs", "status", "runtime-ledger-consistency-latest.json"));

  const envPresence = Object.fromEntries(
    ENV_KEYS.map((key) => [key, Boolean(process.env[key]) ? "set" : "missing"])
  );

  return {
    generatedAtIso: new Date().toISOString(),
    checks: {
      releaseGate: {
        present: Boolean(releaseGate),
        generatedAtIso: releaseGate?.generatedAtIso ?? null,
        passed: releaseGate?.passed ?? null
      },
      syntheticSmoke: {
        present: Boolean(syntheticSmoke),
        generatedAtIso: syntheticSmoke?.generatedAtIso ?? null,
        passed: syntheticSmoke?.passed ?? null
      },
      runtimeLedgerConsistency: {
        present: Boolean(consistency),
        generatedAtIso: consistency?.generatedAtIso ?? null,
        passed: consistency?.passed ?? null,
        skipped: consistency?.skipped ?? null
      }
    },
    flags: {
      phase1: phase1FeatureFlags,
      phase3: phase3FeatureFlags
    },
    envPresence
  };
}
