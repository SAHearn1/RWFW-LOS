/**
 * verify-ledger-contracts.mjs
 *
 * Static analysis verifier for the DB ledger subsystem contracts:
 *   - dbAdapter uses singleton connection pattern (no per-request new Database())
 *   - Retention API has admin/super_admin role guard + audit log
 *   - Ledger records API has role guard + nodejs runtime
 *   - Timeline/learner API restricts to LEARNER_ROLES + nodejs runtime
 *   - Webhook route explicitly declares nodejs runtime (uses node:crypto)
 *   - Orchestration worker-run declares nodejs runtime (uses AWS SDK)
 *
 * No server required. Runs in < 1s.
 */
import { readFileSync } from "node:fs";

const dbAdapterSrc      = readFileSync("lib/ledger/dbAdapter.ts", "utf8");
const retentionSrc      = readFileSync("app/api/admin/retention/route.ts", "utf8");
const ledgerRecordsSrc  = readFileSync("app/api/ledger/records/route.ts", "utf8");
const timelineSrc       = readFileSync("app/api/timeline/learner/route.ts", "utf8");
const webhookSrc        = readFileSync("app/api/webhooks/clerk/route.ts", "utf8");
const orchestrationSrc  = readFileSync("app/api/orchestration/worker-run/route.ts", "utf8");

const failures = [];

// ── DB connection singleton (dbAdapter) ──────────────────────────────────────

if (!dbAdapterSrc.includes("DB_INSTANCES")) {
  failures.push("lib/ledger/dbAdapter.ts: DB_INSTANCES singleton Map is missing");
}
if (!dbAdapterSrc.includes("getOrCreateDatabase")) {
  failures.push("lib/ledger/dbAdapter.ts: getOrCreateDatabase() singleton getter is missing");
}

// Only one `new Database(` call should exist (inside getOrCreateDatabase)
const newDbCalls = (dbAdapterSrc.match(/new Database\(/g) ?? []).length;
if (newDbCalls !== 1) {
  failures.push(
    `lib/ledger/dbAdapter.ts: expected exactly 1 new Database() call (inside singleton getter), found ${newDbCalls}`
  );
}

// All exported DB functions must use getOrCreateDatabase, not new Database directly
const exportedDbFns = [
  "createDbLedgerAdapter",
  "purgeDbLedgerRecordsBefore",
  "deleteDbLedgerRecordsByLearner",
];
for (const fn of exportedDbFns) {
  const fnStart = dbAdapterSrc.indexOf(`export function ${fn}`);
  if (fnStart < 0) {
    failures.push(`lib/ledger/dbAdapter.ts: exported function ${fn} not found`);
    continue;
  }
  const fnBody = dbAdapterSrc.slice(fnStart, fnStart + 400);
  if (fnBody.includes("new Database(")) {
    failures.push(
      `lib/ledger/dbAdapter.ts: ${fn}() creates a new Database() directly — must use getOrCreateDatabase()`
    );
  }
  if (!fnBody.includes("getOrCreateDatabase")) {
    failures.push(`lib/ledger/dbAdapter.ts: ${fn}() does not call getOrCreateDatabase()`);
  }
}

// ── Retention route ───────────────────────────────────────────────────────────

if (!retentionSrc.includes('export const runtime = "nodejs"')) {
  failures.push('app/api/admin/retention/route.ts: missing  export const runtime = "nodejs"');
}
// Must have admin or super_admin guard
const hasAdminGuard =
  retentionSrc.includes("isAdminOrSuperAdmin") ||
  (retentionSrc.includes('"admin"') && retentionSrc.includes('"super_admin"'));
if (!hasAdminGuard) {
  failures.push("app/api/admin/retention/route.ts: missing admin/super_admin role guard");
}
if (!retentionSrc.includes("recordAuditEvent")) {
  failures.push("app/api/admin/retention/route.ts: missing audit event logging");
}
// Both actions must be handled
if (!retentionSrc.includes("purge_before")) {
  failures.push("app/api/admin/retention/route.ts: missing purge_before action handler");
}
if (!retentionSrc.includes("delete_learner")) {
  failures.push("app/api/admin/retention/route.ts: missing delete_learner action handler");
}

// ── Ledger records route ──────────────────────────────────────────────────────

if (!ledgerRecordsSrc.includes('export const runtime = "nodejs"')) {
  failures.push('app/api/ledger/records/route.ts: missing  export const runtime = "nodejs"');
}
if (!ledgerRecordsSrc.includes("parseAppRole")) {
  failures.push("app/api/ledger/records/route.ts: missing role-based access guard (parseAppRole)");
}
if (!ledgerRecordsSrc.includes("403")) {
  failures.push("app/api/ledger/records/route.ts: missing 403 response for unauthorized access");
}

// ── Timeline / learner route ──────────────────────────────────────────────────

if (!timelineSrc.includes('export const runtime = "nodejs"')) {
  failures.push('app/api/timeline/learner/route.ts: missing  export const runtime = "nodejs"');
}
if (!timelineSrc.includes("LEARNER_ROLES")) {
  failures.push("app/api/timeline/learner/route.ts: missing LEARNER_ROLES restriction");
}
// Spot-check that at least one learner role is in the restriction
if (!timelineSrc.includes("student_independent")) {
  failures.push("app/api/timeline/learner/route.ts: LEARNER_ROLES must include student_independent");
}

// ── Webhook route — uses node:crypto, must declare nodejs runtime ─────────────

if (!webhookSrc.includes('export const runtime = "nodejs"')) {
  failures.push('app/api/webhooks/clerk/route.ts: missing  export const runtime = "nodejs"');
}
if (!webhookSrc.includes("node:crypto")) {
  failures.push("app/api/webhooks/clerk/route.ts: expected node:crypto import for HMAC validation");
}

// ── Orchestration worker — uses AWS SDK, must declare nodejs runtime ──────────

if (!orchestrationSrc.includes('export const runtime = "nodejs"')) {
  failures.push('app/api/orchestration/worker-run/route.ts: missing  export const runtime = "nodejs"');
}

// ── Report ────────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  for (const msg of failures) {
    console.error(`  FAIL  ${msg}`);
  }
  console.error(`\nLedger contracts verifier: ${failures.length} failure(s).`);
  process.exit(1);
}

console.log("Ledger contracts verifier passed.");
