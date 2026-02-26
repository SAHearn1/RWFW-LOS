import Database from "better-sqlite3";

import type { StandardDescriptor } from "@/lib/standards/contracts/types";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS standards_registry (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    required_keywords TEXT NOT NULL DEFAULT '[]',
    enabled INTEGER NOT NULL DEFAULT 1,
    weight REAL NOT NULL DEFAULT 1.0,
    created_at_iso TEXT NOT NULL,
    updated_at_iso TEXT NOT NULL
  );
`;

type StandardRow = {
  id: string;
  title: string;
  description: string;
  required_keywords: string;
  enabled: number;
  weight: number;
  created_at_iso: string;
  updated_at_iso: string;
};

function getDb(databasePath = "rootwork-standards.db"): InstanceType<typeof Database> {
  const db = new Database(databasePath);
  db.exec(CREATE_TABLE_SQL);
  return db;
}

function toDescriptor(row: StandardRow): StandardDescriptor {
  let parsed: string[] = [];
  try {
    parsed = JSON.parse(row.required_keywords) as string[];
  } catch {
    parsed = [];
  }
  return {
    id: row.id,
    title: row.title,
    requiredKeywords: parsed,
  };
}

export function listStandards(databasePath?: string): StandardDescriptor[] {
  const db = getDb(databasePath);
  const rows = db.prepare("SELECT * FROM standards_registry ORDER BY created_at_iso ASC").all() as StandardRow[];
  return rows.map(toDescriptor);
}

export function createStandard(
  standard: Omit<StandardDescriptor, "id"> & { id?: string },
  databasePath?: string
): StandardDescriptor {
  const db = getDb(databasePath);
  const now = new Date().toISOString();
  const id = standard.id ?? `rw.custom.${Date.now()}`;

  db.prepare(
    `INSERT INTO standards_registry (id, title, description, required_keywords, enabled, weight, created_at_iso, updated_at_iso)
     VALUES (@id, @title, @description, @requiredKeywords, 1, 1.0, @createdAtIso, @updatedAtIso)`
  ).run({
    id,
    title: standard.title,
    description: "",
    requiredKeywords: JSON.stringify(standard.requiredKeywords),
    createdAtIso: now,
    updatedAtIso: now,
  });

  return {
    id,
    title: standard.title,
    requiredKeywords: standard.requiredKeywords,
  };
}

export function updateStandard(
  id: string,
  patch: Partial<Omit<StandardDescriptor, "id">>,
  databasePath?: string
): StandardDescriptor | null {
  const db = getDb(databasePath);
  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT * FROM standards_registry WHERE id = ?")
    .get(id) as StandardRow | undefined;

  if (!existing) return null;

  const updated: StandardRow = {
    ...existing,
    title: patch.title ?? existing.title,
    required_keywords:
      patch.requiredKeywords !== undefined
        ? JSON.stringify(patch.requiredKeywords)
        : existing.required_keywords,
    updated_at_iso: now,
  };

  db.prepare(
    `UPDATE standards_registry
     SET title = @title, required_keywords = @required_keywords, updated_at_iso = @updated_at_iso
     WHERE id = @id`
  ).run({
    id,
    title: updated.title,
    required_keywords: updated.required_keywords,
    updated_at_iso: now,
  });

  return toDescriptor(updated);
}

export function deleteStandard(id: string, databasePath?: string): boolean {
  const db = getDb(databasePath);
  const result = db.prepare("DELETE FROM standards_registry WHERE id = ?").run(id);
  return result.changes > 0;
}
