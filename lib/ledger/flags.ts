/**
 * Ledger feature flag helpers — safe for client components.
 * Do NOT import dbAdapter.ts (better-sqlite3) from client components.
 *
 * NOTE: For server-side code that also needs to verify a database path is
 * available (not just the flag), use `isDbLedgerAvailable()` from
 * lib/ledger/dbAdapter.ts instead.
 */

/** Client-safe env-only check: returns true when NEXT_PUBLIC_ENABLE_DB_LEDGER=true. */
export function isDbLedgerFlagEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DB_LEDGER === "true";
}

/**
 * @deprecated Renamed to isDbLedgerFlagEnabled() for clarity.
 * Kept for backward compatibility with existing client component imports.
 */
export function shouldUseDbLedger(): boolean {
  return isDbLedgerFlagEnabled();
}
