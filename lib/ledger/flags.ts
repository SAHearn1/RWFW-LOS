/**
 * Ledger feature flag helpers — safe for client components.
 * Do NOT import dbAdapter.ts (better-sqlite3) from client components.
 */
export function shouldUseDbLedger(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DB_LEDGER === "true";
}
