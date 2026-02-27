import type { AsyncLedgerAdapter } from "./dynamo-adapter";
import { createDynamoLedgerAdapter } from "./dynamo-adapter";
import { createDbLedgerAdapter, getDbLedgerAvailability } from "./dbAdapter";

/**
 * Wraps a synchronous SQLite ledger adapter in the AsyncLedgerAdapter interface
 * so callers can use a single await-based API regardless of the backend.
 */
function wrapSyncAdapter(
  adapter: ReturnType<typeof createDbLedgerAdapter>
): AsyncLedgerAdapter {
  return {
    readAll: () => Promise.resolve(adapter.readAll()),
    upsert: (r) => Promise.resolve(adapter.upsert(r)),
    findByMission: (id) => Promise.resolve(adapter.findByMission(id))
  };
}

export type ServerLedgerResult =
  | { available: false; reason: string }
  | { available: true; adapter: AsyncLedgerAdapter };

/**
 * Returns the appropriate server-side ledger adapter based on env configuration:
 *
 *   DB_LEDGER_ADAPTER=dynamo   → DynamoDB (Vercel / production)
 *   NEXT_PUBLIC_ENABLE_DB_LEDGER=true (default) → SQLite via createDbLedgerAdapter
 *   Otherwise                  → unavailable (use localLedgerAdapter client-side)
 *
 * Required env vars for dynamo:
 *   AWS_DYNAMODB_LEDGER_TABLE (or AWS_DYNAMODB_ORCHESTRATION_TABLE as fallback)
 *   AWS_REGION
 */
export function getServerLedgerAdapter(): ServerLedgerResult {
  const adapterType = process.env.DB_LEDGER_ADAPTER?.trim();

  if (adapterType === "dynamo") {
    const table =
      process.env.AWS_DYNAMODB_LEDGER_TABLE?.trim() ||
      process.env.AWS_DYNAMODB_ORCHESTRATION_TABLE?.trim();
    const region = process.env.AWS_REGION?.trim();

    if (!table) {
      return {
        available: false,
        reason:
          "DB_LEDGER_ADAPTER=dynamo requires AWS_DYNAMODB_LEDGER_TABLE " +
          "(or AWS_DYNAMODB_ORCHESTRATION_TABLE) to be set."
      };
    }

    if (!region) {
      return {
        available: false,
        reason: "DB_LEDGER_ADAPTER=dynamo requires AWS_REGION to be set."
      };
    }

    return { available: true, adapter: createDynamoLedgerAdapter(table) };
  }

  // SQLite path (existing behaviour)
  const availability = getDbLedgerAvailability();
  if (!availability.enabled) {
    return { available: false, reason: availability.reason ?? "DB ledger unavailable." };
  }

  if (!availability.databasePath) {
    return { available: false, reason: "DB ledger path is unavailable." };
  }

  return {
    available: true,
    adapter: wrapSyncAdapter(createDbLedgerAdapter(availability.databasePath))
  };
}
