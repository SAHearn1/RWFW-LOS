import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Federation smoke: static contract validation (no live HTTP call required).
// Confirms the federation route, dispatch, protocol, registry, and type contracts
// are all present and structurally correct. A live dispatch test requires
// NEXT_PUBLIC_ENABLE_FEDERATION=true and a running server — handled by role E2E.

const checks = [];

function pass(name) {
  checks.push({ name, status: "pass" });
  console.log(`  ✓ ${name}`);
}

function fail(name, reason) {
  checks.push({ name, status: "fail", reason });
  console.error(`  ✗ ${name}: ${reason}`);
}

function warn(name, reason) {
  checks.push({ name, status: "warn", reason });
  console.warn(`  ⚠ ${name}: ${reason}`);
}

function checkFile(label, relPath) {
  const abs = resolve(relPath);
  if (existsSync(abs)) {
    pass(label);
    return true;
  }
  fail(label, `file not found: ${relPath}`);
  return false;
}

function run() {
  console.log("Federation smoke checks:");

  // 1. Required contract files
  const contractFiles = [
    ["Federation route", "app/api/federation/route.ts"],
    ["Federation dispatch", "lib/federation/dispatch.ts"],
    ["Federation protocol", "lib/federation/protocol.ts"],
    ["Federation registry", "lib/federation/registry.ts"],
    ["Federation types", "lib/federation/types.ts"]
  ];

  for (const [label, path] of contractFiles) {
    checkFile(label, path);
  }

  // 2. Route contains required guards
  const routePath = resolve("app/api/federation/route.ts");
  if (existsSync(routePath)) {
    const content = readFileSync(routePath, "utf8");

    const roleGuard = content.includes("FEDERATION_DISPATCH_ROLES") && content.includes("admin");
    if (roleGuard) {
      pass("Role guard present (admin/super_admin only)");
    } else {
      fail("Role guard present (admin/super_admin only)", "FEDERATION_DISPATCH_ROLES or admin check missing");
    }

    const featureFlag = content.includes("NEXT_PUBLIC_ENABLE_FEDERATION");
    if (featureFlag) {
      pass("Feature flag guard present (NEXT_PUBLIC_ENABLE_FEDERATION)");
    } else {
      fail("Feature flag guard present (NEXT_PUBLIC_ENABLE_FEDERATION)", "flag check missing from route");
    }

    const auditEvent = content.includes("recordAuditEvent");
    if (auditEvent) {
      pass("Audit events recorded on dispatch");
    } else {
      warn("Audit events recorded on dispatch", "recordAuditEvent not found — consider adding");
    }

    const taskValidation = content.includes("isValidTaskEnvelope");
    if (taskValidation) {
      pass("Task envelope validation present");
    } else {
      fail("Task envelope validation present", "isValidTaskEnvelope or equivalent not found");
    }
  }

  // 3. Feature flag status
  const flagEnabled = process.env.NEXT_PUBLIC_ENABLE_FEDERATION === "true";
  if (flagEnabled) {
    pass("NEXT_PUBLIC_ENABLE_FEDERATION=true (federation active in this environment)");
  } else {
    warn(
      "NEXT_PUBLIC_ENABLE_FEDERATION status",
      "flag is not 'true' — federation is disabled; set to 'true' in Vercel production when ready (see issue #171)"
    );
  }

  // 4. Write report
  const passed = checks.every((c) => c.status !== "fail");
  const payload = {
    generatedAtIso: new Date().toISOString(),
    federationEnabled: flagEnabled,
    checks,
    passed
  };

  const reportPath = resolve("docs", "status", "federation-smoke-latest.json");
  if (!existsSync(dirname(reportPath))) {
    mkdirSync(dirname(reportPath), { recursive: true });
  }
  writeFileSync(reportPath, JSON.stringify(payload, null, 2));

  if (!passed) {
    console.error(`\nFederation smoke failed. Report: ${reportPath}`);
    process.exit(1);
  }

  console.log(`\nFederation smoke passed. Report: ${reportPath}`);
}

run();
