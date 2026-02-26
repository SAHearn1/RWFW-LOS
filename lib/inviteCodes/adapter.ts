import Database from "better-sqlite3";

import type { AppRole } from "@/lib/auth/roles";

export type InviteCode = {
  code: string;
  role: AppRole;
  orgId: string | null;
  createdBy: string;
  maxUses: number;
  useCount: number;
  expiresAtIso: string | null;
  createdAtIso: string;
};

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS invite_codes (
    code TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    org_id TEXT,
    created_by TEXT NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 1,
    use_count INTEGER NOT NULL DEFAULT 0,
    expires_at_iso TEXT,
    created_at_iso TEXT NOT NULL
  );
`;

function getDb(databasePath = "rootwork-invite-codes.db"): InstanceType<typeof Database> {
  const db = new Database(databasePath);
  db.exec(CREATE_TABLE_SQL);
  return db;
}

function toInviteCode(row: {
  code: string;
  role: AppRole;
  org_id: string | null;
  created_by: string;
  max_uses: number;
  use_count: number;
  expires_at_iso: string | null;
  created_at_iso: string;
}): InviteCode {
  return {
    code: row.code,
    role: row.role,
    orgId: row.org_id,
    createdBy: row.created_by,
    maxUses: row.max_uses,
    useCount: row.use_count,
    expiresAtIso: row.expires_at_iso,
    createdAtIso: row.created_at_iso,
  };
}

export function createInviteCode(
  params: {
    code: string;
    role: AppRole;
    orgId?: string;
    createdBy: string;
    maxUses?: number;
    expiresAtIso?: string;
  },
  databasePath?: string
): InviteCode {
  const db = getDb(databasePath);
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO invite_codes (code, role, org_id, created_by, max_uses, use_count, expires_at_iso, created_at_iso)
    VALUES (@code, @role, @orgId, @createdBy, @maxUses, 0, @expiresAtIso, @createdAtIso)
  `);
  stmt.run({
    code: params.code,
    role: params.role,
    orgId: params.orgId ?? null,
    createdBy: params.createdBy,
    maxUses: params.maxUses ?? 1,
    expiresAtIso: params.expiresAtIso ?? null,
    createdAtIso: now,
  });
  return {
    code: params.code,
    role: params.role,
    orgId: params.orgId ?? null,
    createdBy: params.createdBy,
    maxUses: params.maxUses ?? 1,
    useCount: 0,
    expiresAtIso: params.expiresAtIso ?? null,
    createdAtIso: now,
  };
}

export type InviteCodeValidation =
  | { valid: true; inviteCode: InviteCode }
  | { valid: false; reason: "not_found" | "expired" | "exhausted" };

export function validateAndConsumeInviteCode(
  code: string,
  databasePath?: string
): InviteCodeValidation {
  const db = getDb(databasePath);
  const row = db
    .prepare(`SELECT * FROM invite_codes WHERE code = ?`)
    .get(code) as Parameters<typeof toInviteCode>[0] | undefined;

  if (!row) return { valid: false, reason: "not_found" };

  const inviteCode = toInviteCode(row);

  if (inviteCode.expiresAtIso && new Date(inviteCode.expiresAtIso) < new Date()) {
    return { valid: false, reason: "expired" };
  }

  if (inviteCode.useCount >= inviteCode.maxUses) {
    return { valid: false, reason: "exhausted" };
  }

  // Consume one use
  db.prepare(`UPDATE invite_codes SET use_count = use_count + 1 WHERE code = ?`).run(code);

  return { valid: true, inviteCode };
}
