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

type LedgerAvailability = {
  enabled: boolean;
  databasePath?: string;
  reason?: string;
};

function ensureTable(database: InstanceType<typeof Database>): void {
  database.exec(CREATE_TABLE_SQL);
}

function toRecord(row: {
  id: string;
  type: LedgerRecord["type"];
  mission_id: string;
  learner_id: string;
  payload_json: string;
  created_at_iso: string;
  updated_at_iso: string;
}): LedgerRecord {
  return {
    id: row.id,
    type: row.type,
    missionId: row.mission_id,
    learnerId: row.learner_id,
    payload: JSON.parse(row.payload_json),
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

  const database = new Database(resolvedPath);
  ensureTable(database);

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

export function shouldUseDbLedger(): boolean {
  return getDbLedgerAvailability().enabled;
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

  const database = new Database(resolvedPath);
  ensureTable(database);

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

  const database = new Database(resolvedPath);
  ensureTable(database);

  const stmt = database.prepare(`DELETE FROM ledger_records WHERE learner_id = ?`);
  const result = stmt.run(learnerId);
  return result.changes;
}
