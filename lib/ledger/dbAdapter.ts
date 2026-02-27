import Database from "better-sqlite3";

import type { LedgerAdapter, LedgerRecord } from "./adapter";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ledger_records (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    learner_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at_iso TEXT NOT NULL,
    updated_at_iso TEXT NOT NULL
  );
`;

const DEFAULT_DATABASE_PATH = "rootwork-ledger.db";

// Singleton connections keyed by resolved database path.
// better-sqlite3 is synchronous; reusing one connection per path avoids
// opening a new connection on every API request within the same process.
const DB_INSTANCES = new Map<string, InstanceType<typeof Database>>();

function getOrCreateDatabase(resolvedPath: string): InstanceType<typeof Database> {
  const existing = DB_INSTANCES.get(resolvedPath);
  if (existing) return existing;
  const db = new Database(resolvedPath);
  db.exec(CREATE_TABLE_SQL);
  DB_INSTANCES.set(resolvedPath, db);
  return db;
}

type LedgerAvailability = {
  enabled: boolean;
  databasePath?: string;
  reason?: string;
};

function toRecord(row: {
  id: string;
  type: LedgerRecord["type"];
  mission_id: string;
  learner_id: string;
  payload_json: string;
  created_at_iso: string;
  updated_at_iso: string;
}): LedgerRecord {
  let payload: unknown;
  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    console.warn(`[ledger/dbAdapter] toRecord: failed to parse payload_json for record id=${row.id} type=${row.type} — using empty object`);
    payload = {};
  }

  return {
    id: row.id,
    type: row.type,
    missionId: row.mission_id,
    learnerId: row.learner_id,
    payload: payload as LedgerRecord["payload"],
    createdAtIso: row.created_at_iso,
    updatedAtIso: row.updated_at_iso
  };
}

function resolveDatabasePath(): string | null {
  const explicitPath = process.env.DB_LEDGER_PATH?.trim();
  if (explicitPath) {
    return explicitPath;
  }

  const runningOnVercel = process.env.VERCEL === "1";
  if (runningOnVercel) {
    return null;
  }

  return DEFAULT_DATABASE_PATH;
}

export function getDbLedgerAvailability(): LedgerAvailability {
  if (process.env.NEXT_PUBLIC_ENABLE_DB_LEDGER !== "true") {
    return {
      enabled: false,
      reason: "DB ledger disabled via NEXT_PUBLIC_ENABLE_DB_LEDGER."
    };
  }

  const databasePath = resolveDatabasePath();
  if (!databasePath) {
    return {
      enabled: false,
      reason: "DB ledger disabled in serverless runtime without DB_LEDGER_PATH override."
    };
  }

  return {
    enabled: true,
    databasePath
  };
}

export function createDbLedgerAdapter(databasePath?: string): LedgerAdapter {
  const resolvedPath = databasePath ?? resolveDatabasePath();
  if (!resolvedPath) {
    throw new Error("DB ledger path is unavailable for current runtime.");
  }

  const database = getOrCreateDatabase(resolvedPath);

  const readAllStatement = database.prepare(`
    SELECT id, type, mission_id, learner_id, payload_json, created_at_iso, updated_at_iso
    FROM ledger_records
    ORDER BY updated_at_iso DESC
  `);

  const findByMissionStatement = database.prepare(`
    SELECT id, type, mission_id, learner_id, payload_json, created_at_iso, updated_at_iso
    FROM ledger_records
    WHERE mission_id = ?
    ORDER BY updated_at_iso DESC
  `);

  const upsertStatement = database.prepare(`
    INSERT INTO ledger_records (id, type, mission_id, learner_id, payload_json, created_at_iso, updated_at_iso)
    VALUES (@id, @type, @missionId, @learnerId, @payloadJson, @createdAtIso, @updatedAtIso)
    ON CONFLICT(id) DO UPDATE SET
      type = excluded.type,
      mission_id = excluded.mission_id,
      learner_id = excluded.learner_id,
      payload_json = excluded.payload_json,
      updated_at_iso = excluded.updated_at_iso
  `);

  return {
    readAll() {
      const rows = readAllStatement.all() as Array<{
        id: string;
        type: LedgerRecord["type"];
        mission_id: string;
        learner_id: string;
        payload_json: string;
        created_at_iso: string;
        updated_at_iso: string;
      }>;
      return rows.map(toRecord);
    },
    upsert(record) {
      upsertStatement.run({
        id: record.id,
        type: record.type,
        missionId: record.missionId,
        learnerId: record.learnerId,
        payloadJson: JSON.stringify(record.payload),
        createdAtIso: record.createdAtIso,
        updatedAtIso: record.updatedAtIso
      });
      return record;
    },
    findByMission(missionId) {
      const rows = findByMissionStatement.all(missionId) as Array<{
        id: string;
        type: LedgerRecord["type"];
        mission_id: string;
        learner_id: string;
        payload_json: string;
        created_at_iso: string;
        updated_at_iso: string;
      }>;
      return rows.map(toRecord);
    }
  };
}

/**
 * Server-side availability check: returns true only when the DB ledger flag is set
 * AND a valid database path is resolvable (i.e., not running on Vercel without DB_LEDGER_PATH).
 * For a simple env-only flag check in client components, use `isDbLedgerFlagEnabled` from flags.ts.
 */
export function isDbLedgerAvailable(): boolean {
  return getDbLedgerAvailability().enabled;
}

/** @deprecated Use isDbLedgerAvailable() for server-side code that needs path validation. */
export function shouldUseDbLedger(): boolean {
  return isDbLedgerAvailable();
}

/**
 * Purge ledger records whose updatedAtIso is strictly before cutoffIso.
 * Returns the count of deleted rows.
 */
export function purgeDbLedgerRecordsBefore(cutoffIso: string, databasePath?: string): number {
  const resolvedPath = databasePath ?? resolveDatabasePath();
  if (!resolvedPath) {
    throw new Error("DB ledger path is unavailable for current runtime.");
  }

  const database = getOrCreateDatabase(resolvedPath);
  const stmt = database.prepare(`DELETE FROM ledger_records WHERE updated_at_iso < ?`);
  const result = stmt.run(cutoffIso);
  return result.changes;
}

/**
 * Delete all ledger records belonging to a specific learner.
 * Returns the count of deleted rows.
 */
export function deleteDbLedgerRecordsByLearner(learnerId: string, databasePath?: string): number {
  const resolvedPath = databasePath ?? resolveDatabasePath();
  if (!resolvedPath) {
    throw new Error("DB ledger path is unavailable for current runtime.");
  }

  const database = getOrCreateDatabase(resolvedPath);
  const stmt = database.prepare(`DELETE FROM ledger_records WHERE learner_id = ?`);
  const result = stmt.run(learnerId);
  return result.changes;
}
