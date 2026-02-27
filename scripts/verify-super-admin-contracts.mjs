/**
 * verify-super-admin-contracts.mjs
 *
 * Static analysis verifier for super-admin API route contracts.
 * Checks that security invariants (userId format validation, orgId enforcement,
 * audit logging, runtime declaration, super_admin role guard, and Clerk API
 * response validation) are all present in source code.
 *
 * No server required. Runs in < 1s.
 */
import { readFileSync } from "node:fs";

const assignRoleSrc  = readFileSync("app/api/super-admin/assign-role/route.ts", "utf8");
const usersSrc       = readFileSync("app/api/super-admin/users/route.ts", "utf8");
const appRolesSrc    = readFileSync("lib/auth/roles.ts", "utf8");
const layoutSrc      = readFileSync("app/app/layout.tsx", "utf8");

const failures = [];

// ── Runtime declarations ──────────────────────────────────────────────────────
if (!assignRoleSrc.includes('export const runtime = "nodejs"')) {
  failures.push("assign-role/route.ts: missing  export const runtime = \"nodejs\"");
}
if (!usersSrc.includes('export const runtime = "nodejs"')) {
  failures.push("users/route.ts: missing  export const runtime = \"nodejs\"");
}

// ── super_admin role guard present in both routes ────────────────────────────
if (!assignRoleSrc.includes('"super_admin"')) {
  failures.push("assign-role/route.ts: missing super_admin role guard");
}
if (!usersSrc.includes('"super_admin"')) {
  failures.push("users/route.ts: missing super_admin role guard");
}

// ── userId format validation (assign-role) ───────────────────────────────────
if (!assignRoleSrc.includes("CLERK_USER_ID_RE")) {
  failures.push("assign-role/route.ts: missing CLERK_USER_ID_RE userId format validation");
}
if (!assignRoleSrc.includes("usr_")) {
  failures.push("assign-role/route.ts: CLERK_USER_ID_RE pattern does not reference usr_ prefix");
}

// ── orgId enforcement for org-required roles (assign-role) ───────────────────
if (!assignRoleSrc.includes("ORG_REQUIRED_ROLES")) {
  failures.push("assign-role/route.ts: missing ORG_REQUIRED_ROLES set");
}
if (!assignRoleSrc.includes("orgId is required")) {
  failures.push("assign-role/route.ts: missing orgId enforcement error message");
}

// ORG_REQUIRED_ROLES must cover all roles that require an org
const orgRequiredRoles = [
  "student_enrolled",
  "teacher",
  "professional_development",
  "admin",
  "super_admin",
];
for (const role of orgRequiredRoles) {
  // The ORG_REQUIRED_ROLES Set block in the file must contain each role
  const setPattern = /ORG_REQUIRED_ROLES[\s\S]*?\]\s*\)/;
  const setBlock = assignRoleSrc.match(setPattern)?.[0] ?? "";
  if (!setBlock.includes(`"${role}"`)) {
    failures.push(`assign-role/route.ts: ORG_REQUIRED_ROLES is missing required role "${role}"`);
  }
}

// ── audit event logging (assign-role) ────────────────────────────────────────
if (!assignRoleSrc.includes("recordAuditEvent")) {
  failures.push("assign-role/route.ts: missing audit event logging (recordAuditEvent)");
}
if (!assignRoleSrc.includes("super_admin.assign_role")) {
  failures.push("assign-role/route.ts: audit eventType must be \"super_admin.assign_role\"");
}

// ── Clerk API response validated as array before mapping (users) ─────────────
if (!usersSrc.includes("Array.isArray")) {
  failures.push("users/route.ts: missing Array.isArray() check before mapping Clerk response");
}
if (!usersSrc.includes("502")) {
  failures.push("users/route.ts: missing 502 response for upstream Clerk API failures");
}

// ── All APP_ROLES defined in lib/auth/roles.ts ───────────────────────────────
const expectedRoles = [
  "student_independent",
  "student_enrolled",
  "adult_learner",
  "teacher",
  "professional_development",
  "admin",
  "super_admin",
];
for (const role of expectedRoles) {
  if (!appRolesSrc.includes(`"${role}"`)) {
    failures.push(`lib/auth/roles.ts: missing expected AppRole "${role}"`);
  }
}

// ── org check in app layout must cover student_enrolled (sync with assign-role) ──
// layout.tsx:40 must include student_enrolled alongside teacher/admin
if (!layoutSrc.includes('"student_enrolled"') || !layoutSrc.includes("orgId")) {
  failures.push(
    "app/app/layout.tsx: student_enrolled org check missing — " +
    "must mirror ORG_REQUIRED_ROLES in assign-role/route.ts"
  );
}

// ── Report ────────────────────────────────────────────────────────────────────
if (failures.length > 0) {
  for (const msg of failures) {
    console.error(`  FAIL  ${msg}`);
  }
  console.error(`\nSuper-admin contracts verifier: ${failures.length} failure(s).`);
  process.exit(1);
}

console.log("Super-admin contracts verifier passed.");
