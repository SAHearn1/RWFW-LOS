import Database from "better-sqlite3";

import type { FederationTaskEnvelope } from "@/lib/federation/types";

export type PersistedTask = FederationTaskEnvelope & { dispatchedAt: string };

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS federation_tasks (
    task_id TEXT PRIMARY KEY,
    correlation_id TEXT NOT NULL,
    assigned_agent_id TEXT,
    capability_id TEXT NOT NULL,
    dispatched_at_iso TEXT NOT NULL,
    payload_json TEXT NOT NULL
  );
`;

type FederationTaskRow = {
  task_id: string;
  correlation_id: string;
  assigned_agent_id: string | null;
  capability_id: string;
  dispatched_at_iso: string;
  payload_json: string;
};

function getDb(databasePath = "rootwork-federation.db"): InstanceType<typeof Database> {
  const db = new Database(databasePath);
  db.exec(CREATE_TABLE_SQL);
  return db;
}

function toPersistedTask(row: FederationTaskRow): PersistedTask {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(row.payload_json) as Record<string, unknown>;
  } catch {
    payload = {};
  }
  return {
    taskId: row.task_id,
    correlationId: row.correlation_id,
    requestedByRole: "",
    assignedAgentId: row.assigned_agent_id ?? "",
    capabilityId: row.capability_id,
    payload,
    dispatchedAt: row.dispatched_at_iso,
  };
}

export function persistTask(task: PersistedTask, databasePath?: string): void {
  const db = getDb(databasePath);
  db.prepare(
    `INSERT OR REPLACE INTO federation_tasks
       (task_id, correlation_id, assigned_agent_id, capability_id, dispatched_at_iso, payload_json)
     VALUES
       (@task_id, @correlation_id, @assigned_agent_id, @capability_id, @dispatched_at_iso, @payload_json)`
  ).run({
    task_id: task.taskId,
    correlation_id: task.correlationId,
    assigned_agent_id: task.assignedAgentId || null,
    capability_id: task.capabilityId,
    dispatched_at_iso: task.dispatchedAt,
    payload_json: JSON.stringify(task.payload),
  });
}

export function getRecentTasks(limit = 50, databasePath?: string): PersistedTask[] {
  const db = getDb(databasePath);
  const rows = db
    .prepare(
      `SELECT * FROM federation_tasks ORDER BY dispatched_at_iso DESC LIMIT ?`
    )
    .all(limit) as FederationTaskRow[];
  return rows.map(toPersistedTask);
}

export function countTasks(databasePath?: string): number {
  const db = getDb(databasePath);
  const result = db
    .prepare("SELECT COUNT(*) as count FROM federation_tasks")
    .get() as { count: number };
  return result.count;
}
