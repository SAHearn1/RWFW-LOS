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
    updated_at_iso TEXT NOT NULL,
    competencies_json TEXT,
    rigor_level INTEGER,
    verified_by TEXT,
    verification_method TEXT,
    revision_history_json TEXT,
    reflection_id TEXT,
    data_tier TEXT DEFAULT 'tier-1'
  );
`;

function ensureTable(database: InstanceType<typeof Database>): void {
  database.exec(CREATE_TABLE_SQL);

  const newColumns = [
    "ALTER TABLE ledger_records ADD COLUMN competencies_json TEXT",
    "ALTER TABLE ledger_records ADD COLUMN rigor_level INTEGER",
    "ALTER TABLE ledger_records ADD COLUMN verified_by TEXT",
    "ALTER TABLE ledger_records ADD COLUMN verification_method TEXT",
    "ALTER TABLE ledger_records ADD COLUMN revision_history_json TEXT",
    "ALTER TABLE ledger_records ADD COLUMN reflection_id TEXT",
    "ALTER TABLE ledger_records ADD COLUMN data_tier TEXT DEFAULT 'tier-1'",
  ];
  for (const sql of newColumns) {
    try {
      database.exec(sql);
    } catch {
      /* column already exists */
    }
  }
}

function toRecord(row: {
  id: string;
  type: LedgerRecord["type"];
  mission_id: string;
  learner_id: string;
  payload_json: string;
  created_at_iso: string;
  updated_at_iso: string;
  competencies_json: string | null;
  rigor_level: number | null;
  verified_by: string | null;
  verification_method: string | null;
  revision_history_json: string | null;
  reflection_id: string | null;
  data_tier: string | null;
}): LedgerRecord {
  return {
    id: row.id,
    type: row.type,
    missionId: row.mission_id,
    learnerId: row.learner_id,
    payload: JSON.parse(row.payload_json),
    createdAtIso: row.created_at_iso,
    updatedAtIso: row.updated_at_iso,
    ...(row.competencies_json !== null && {
      competencies: JSON.parse(row.competencies_json) as string[],
    }),
    ...(row.rigor_level !== null && { rigorLevel: row.rigor_level }),
    ...(row.verified_by !== null && { verifiedBy: row.verified_by }),
    ...(row.verification_method !== null && {
      verificationMethod: row.verification_method as LedgerRecord["verificationMethod"],
    }),
    ...(row.revision_history_json !== null && {
      revisionHistory: JSON.parse(row.revision_history_json) as string[],
    }),
    ...(row.reflection_id !== null && { reflectionId: row.reflection_id }),
    ...(row.data_tier !== null && {
      dataTier: row.data_tier as LedgerRecord["dataTier"],
    }),
  };
}

export function createDbLedgerAdapter(databasePath = "rootwork-ledger.db"): LedgerAdapter {
  const database = new Database(databasePath);
  ensureTable(database);

  const readAllStatement = database.prepare(`
    SELECT id, type, mission_id, learner_id, payload_json, created_at_iso, updated_at_iso,
           competencies_json, rigor_level, verified_by, verification_method,
           revision_history_json, reflection_id, data_tier
    FROM ledger_records
    ORDER BY updated_at_iso DESC
  `);

  const findByMissionStatement = database.prepare(`
    SELECT id, type, mission_id, learner_id, payload_json, created_at_iso, updated_at_iso,
           competencies_json, rigor_level, verified_by, verification_method,
           revision_history_json, reflection_id, data_tier
    FROM ledger_records
    WHERE mission_id = ?
    ORDER BY updated_at_iso DESC
  `);

  const upsertStatement = database.prepare(`
    INSERT INTO ledger_records (
      id, type, mission_id, learner_id, payload_json, created_at_iso, updated_at_iso,
      competencies_json, rigor_level, verified_by, verification_method,
      revision_history_json, reflection_id, data_tier
    )
    VALUES (
      @id, @type, @missionId, @learnerId, @payloadJson, @createdAtIso, @updatedAtIso,
      @competenciesJson, @rigorLevel, @verifiedBy, @verificationMethod,
      @revisionHistoryJson, @reflectionId, @dataTier
    )
    ON CONFLICT(id) DO UPDATE SET
      type = excluded.type,
      mission_id = excluded.mission_id,
      learner_id = excluded.learner_id,
      payload_json = excluded.payload_json,
      updated_at_iso = excluded.updated_at_iso,
      competencies_json = excluded.competencies_json,
      rigor_level = excluded.rigor_level,
      verified_by = excluded.verified_by,
      verification_method = excluded.verification_method,
      revision_history_json = excluded.revision_history_json,
      reflection_id = excluded.reflection_id,
      data_tier = excluded.data_tier
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
        competencies_json: string | null;
        rigor_level: number | null;
        verified_by: string | null;
        verification_method: string | null;
        revision_history_json: string | null;
        reflection_id: string | null;
        data_tier: string | null;
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
        updatedAtIso: record.updatedAtIso,
        competenciesJson: record.competencies != null ? JSON.stringify(record.competencies) : null,
        rigorLevel: record.rigorLevel ?? null,
        verifiedBy: record.verifiedBy ?? null,
        verificationMethod: record.verificationMethod ?? null,
        revisionHistoryJson:
          record.revisionHistory != null ? JSON.stringify(record.revisionHistory) : null,
        reflectionId: record.reflectionId ?? null,
        dataTier: record.dataTier ?? null,
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
        competencies_json: string | null;
        rigor_level: number | null;
        verified_by: string | null;
        verification_method: string | null;
        revision_history_json: string | null;
        reflection_id: string | null;
        data_tier: string | null;
      }>;
      return rows.map(toRecord);
    },
  };
}

export function shouldUseDbLedger(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DB_LEDGER === "true";
}

export type DbLedgerAvailability =
  | { enabled: true; databasePath: string }
  | { enabled: false; reason: string; databasePath?: never };

export function getDbLedgerAvailability(databasePath = "rootwork-ledger.db"): DbLedgerAvailability {
  if (!shouldUseDbLedger()) {
    return { enabled: false, reason: "NEXT_PUBLIC_ENABLE_DB_LEDGER is not set to true." };
  }
  return { enabled: true, databasePath };
}
