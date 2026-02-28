/**
 * Enterprise Release Gate — verify-enterprise-gate.mjs
 *
 * Extended verification on top of the standard release gate.
 * Checks enterprise-specific requirements for multi-tenant production readiness:
 *
 *   1. Centralized authorize() helper exists (lib/auth/authorize.ts)
 *   2. Threat intelligence module exists (lib/governance/threatIntelligence.ts)
 *   3. Operability score module exists (lib/governance/operabilityScore.ts)
 *   4. AI inference audit module exists (lib/llm/inferenceAudit.ts)
 *   5. Governance API routes exist (operability, threat-intel, ai-audit)
 *   6. DynamoDB tenant-scoped adapter is present (createTenantScopedDynamoLedgerAdapter)
 *   7. Orchestration state store has transition history (recordTransition, getTransitionHistory)
 *   8. Inference route integrates AI audit (buildInferenceAuditEvent call)
 *   9. NEXT_PUBLIC_ENABLE_INFERENCE_AUDIT is documented in .env.example
 *  10. In-memory fallback blocked in production (ALLOW_AWS_WORKER_FALLBACK != true when VERCEL_ENV=production)
 *  11. Clerk webhook secret check is present in routeAccess or middleware
 *  12. Rate limiting imported in all governance routes
 *
 * Exit 0 = all checks pass.
 * Exit 1 = one or more checks failed.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(".");

const checks = [];

function check(name, pass, detail = "") {
  checks.push({ name, pass, detail });
  const icon = pass ? "✅" : "❌";
  const msg = detail ? ` — ${detail}` : "";
  console.log(`  ${icon} ${name}${msg}`);
}

function fileContains(relPath, ...patterns) {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) return false;
  const content = readFileSync(abs, "utf8");
  return patterns.every((p) => content.includes(p));
}

function fileExists(relPath) {
  return existsSync(resolve(ROOT, relPath));
}

console.log("\n🏛  Enterprise Swarm Orchestration Gate\n");
console.log("Checking enterprise-grade operability requirements...\n");

// ── 1. Core authorization layer ───────────────────────────────────────────────
check(
  "lib/auth/authorize.ts exists",
  fileExists("lib/auth/authorize.ts"),
  "Centralized authorize() helper required"
);

check(
  "authorize() exports AuthorizeResult type",
  fileContains("lib/auth/authorize.ts", "AuthorizeResult", "AuthorizeOk", "AuthorizeDenied"),
  "Type-safe return envelope"
);

check(
  "authorize() logs audit events on denial",
  fileContains("lib/auth/authorize.ts", "recordAuditEvent", "api.auth.denied"),
  "All denials must be audited"
);

// ── 2. Threat intelligence layer ──────────────────────────────────────────────
check(
  "lib/governance/threatIntelligence.ts exists",
  fileExists("lib/governance/threatIntelligence.ts"),
  "Authorization anomaly index required"
);

check(
  "Threat intel exports ThreatIntelReport + generateThreatIntelReport",
  fileContains(
    "lib/governance/threatIntelligence.ts",
    "ThreatIntelReport",
    "generateThreatIntelReport",
    "authorizationAnomalyIndex"
  ),
  "Must include anomaly index and report generation"
);

// ── 3. Operability scoring layer ──────────────────────────────────────────────
check(
  "lib/governance/operabilityScore.ts exists",
  fileExists("lib/governance/operabilityScore.ts"),
  "Multi-dimensional operability score required"
);

check(
  "Operability score has six dimensions",
  fileContains(
    "lib/governance/operabilityScore.ts",
    "security",
    "tenantIsolation",
    "workerReliability",
    "auditCoverage",
    "aiIntegrity",
    "uxHealth"
  ),
  "All six governance dimensions must be present"
);

check(
  "Operability score has productionReady flag",
  fileContains("lib/governance/operabilityScore.ts", "productionReady"),
  "Gate blocker detection required"
);

// ── 4. AI governance layer ────────────────────────────────────────────────────
check(
  "lib/llm/inferenceAudit.ts exists",
  fileExists("lib/llm/inferenceAudit.ts"),
  "AI prompt lineage and audit trail required"
);

check(
  "Inference audit exports buildInferenceAuditEvent + recordInferenceAuditEvent",
  fileContains(
    "lib/llm/inferenceAudit.ts",
    "buildInferenceAuditEvent",
    "recordInferenceAuditEvent",
    "promptHash",
    "createHash"
  ),
  "SHA-256 prompt hashing and audit recording required"
);

// ── 5. Governance API routes ───────────────────────────────────────────────────
check(
  "app/api/governance/operability/route.ts exists",
  fileExists("app/api/governance/operability/route.ts"),
  "Operability score endpoint required"
);

check(
  "app/api/governance/threat-intel/route.ts exists",
  fileExists("app/api/governance/threat-intel/route.ts"),
  "Threat intelligence endpoint required"
);

check(
  "app/api/governance/ai-audit/route.ts exists",
  fileExists("app/api/governance/ai-audit/route.ts"),
  "AI audit endpoint required"
);

check(
  "Governance routes use authorize() helper",
  fileContains("app/api/governance/operability/route.ts", "authorize(") &&
    fileContains("app/api/governance/threat-intel/route.ts", "authorize(") &&
    fileContains("app/api/governance/ai-audit/route.ts", "authorize("),
  "All governance routes must use centralized authorization"
);

// ── 6. Data plane: tenant isolation ───────────────────────────────────────────
check(
  "lib/ledger/dynamo-adapter.ts has tenant-scoped adapter",
  fileContains(
    "lib/ledger/dynamo-adapter.ts",
    "createTenantScopedDynamoLedgerAdapter",
    "tenantId",
    "tenant#"
  ),
  "Per-tenant partition keys required"
);

check(
  "Dynamo ledger adapter has optimistic locking",
  fileContains(
    "lib/ledger/dynamo-adapter.ts",
    "upsertWithVersion",
    "ConditionalCheckFailedException",
    "version_conflict"
  ),
  "Optimistic locking prevents lost updates"
);

// ── 7. Orchestration: transition history ──────────────────────────────────────
check(
  "lib/orchestration/dynamoStateStore.ts has recordTransition",
  fileContains(
    "lib/orchestration/dynamoStateStore.ts",
    "recordTransition",
    "getTransitionHistory",
    "transition#"
  ),
  "Append-only state transition log required"
);

// ── 8. AI audit integration in inference route ────────────────────────────────
check(
  "app/api/inference/route.ts integrates AI audit",
  fileContains(
    "app/api/inference/route.ts",
    "buildInferenceAuditEvent",
    "recordInferenceAuditEvent",
    "NEXT_PUBLIC_ENABLE_INFERENCE_AUDIT"
  ),
  "Inference route must record AI audit events"
);

// ── 9. Env var documentation ───────────────────────────────────────────────────
check(
  ".env.example documents NEXT_PUBLIC_ENABLE_INFERENCE_AUDIT",
  fileContains(".env.example", "NEXT_PUBLIC_ENABLE_INFERENCE_AUDIT"),
  "Enterprise env vars must be documented"
);

// ── 10. Production safety: in-memory fallback ─────────────────────────────────
const isProduction = process.env.VERCEL_ENV === "production";
if (isProduction) {
  const fallbackAllowed = process.env.ALLOW_AWS_WORKER_FALLBACK === "true";
  check(
    "In-memory worker fallback is blocked in production",
    !fallbackAllowed,
    "ALLOW_AWS_WORKER_FALLBACK must not be 'true' in production"
  );
} else {
  check(
    "In-memory worker fallback production guard (skipped — not production)",
    true,
    `VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}`
  );
}

// ── 11. Webhook secret presence ────────────────────────────────────────────────
check(
  "app/api/webhooks/clerk/route.ts validates HMAC signature",
  fileContains(
    "app/api/webhooks/clerk/route.ts",
    "CLERK_WEBHOOK_SECRET",
    "svix"
  ),
  "Clerk webhook handler must validate HMAC signatures"
);

// ── 12. Rate limiting on governance routes ────────────────────────────────────
check(
  "Governance routes enforce rate limiting",
  fileContains("app/api/governance/operability/route.ts", "enforceRateLimit") &&
    fileContains("app/api/governance/threat-intel/route.ts", "enforceRateLimit") &&
    fileContains("app/api/governance/ai-audit/route.ts", "enforceRateLimit"),
  "All governance endpoints must be rate-limited"
);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n─────────────────────────────────────────────");

const passed = checks.filter((c) => c.pass).length;
const failed = checks.filter((c) => !c.pass).length;
const total = checks.length;

if (failed === 0) {
  console.log(
    `\n✅ Enterprise gate passed: ${passed}/${total} checks passed.\n`
  );
  process.exit(0);
} else {
  console.error(
    `\n❌ Enterprise gate failed: ${failed}/${total} checks failed.\n`
  );
  const failedChecks = checks.filter((c) => !c.pass);
  console.error("Failed checks:");
  for (const c of failedChecks) {
    console.error(`  • ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.error("");
  process.exit(1);
}
