export const PHASE1_FEATURE_FLAG_KEYS = [
  "NEXT_PUBLIC_ENABLE_LEDGER",
  "NEXT_PUBLIC_ENABLE_MCP",
  "NEXT_PUBLIC_ENABLE_PICKUP",
  "NEXT_PUBLIC_ENABLE_OFFLINE",
  "NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT"
] as const;

export type Phase1FeatureFlagKey = (typeof PHASE1_FEATURE_FLAG_KEYS)[number];

export const PHASE3_FEATURE_FLAG_KEYS = [
  "NEXT_PUBLIC_ENABLE_RUNTIME",
  "NEXT_PUBLIC_ENABLE_LEDGER",
  "NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER"
] as const;

export type Phase3FeatureFlagKey = (typeof PHASE3_FEATURE_FLAG_KEYS)[number];

function readFlag(key: string): boolean {
  return process.env[key] === "true";
}

export const phase1FeatureFlags = {
  enableLedger: readFlag("NEXT_PUBLIC_ENABLE_LEDGER"),
  enableMcp: readFlag("NEXT_PUBLIC_ENABLE_MCP"),
  enablePickup: readFlag("NEXT_PUBLIC_ENABLE_PICKUP"),
  enableOffline: readFlag("NEXT_PUBLIC_ENABLE_OFFLINE"),
  enableCoreViteMount: readFlag("NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT")
} as const;

export const phase3FeatureFlags = {
  enableRuntime: readFlag("NEXT_PUBLIC_ENABLE_RUNTIME"),
  enableLedger: readFlag("NEXT_PUBLIC_ENABLE_LEDGER"),
  enableStandardsVerifier: readFlag("NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER")
} as const;
