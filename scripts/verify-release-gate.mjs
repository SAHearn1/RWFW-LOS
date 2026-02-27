import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const checks = [
  "lint",
  "typecheck",
  "build",
  "verify:env",
  "verify:env-parity",
  "verify:engine-smoke",
  "verify:webhook-contract",
  "verify:security-checklist",
  "verify:branch-policy",
  "verify:swarm-overlap",
  "verify:role-routes",
  "verify:runtime-routes",
  "verify:onboarding",
  "verify:runtime-ledger-consistency",
  "verify:http-smoke",
  "verify:super-admin-contracts",
  "verify:ledger-contracts"
];

const nonBlockingChecks = [
  "verify:cloud-aws-smoke",
  "verify:federation-smoke",
  "verify:health-check"
];

const ledgerConsistencyReportPath = resolve(
  "docs",
  "status",
  "runtime-ledger-consistency-latest.json"
);

function runNpmScript(script) {
  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", `npm run ${script}`], { stdio: "inherit" });
  }

  return spawnSync("npm", ["run", script], { stdio: "inherit" });
}

function readJsonReport(reportPath) {
  if (!existsSync(reportPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(reportPath, "utf8"));
  } catch {
    return null;
  }
}

const results = [];

let gateFailedEarly = false;

for (const script of checks) {
  const startedAtIso = new Date().toISOString();
  const run = runNpmScript(script);
  const finishedAtIso = new Date().toISOString();
  let passed = run.status === 0;

  // After running verify:runtime-ledger-consistency, inspect the JSON report.
  // If the report has skipped: true and LEDGER_CONSISTENCY_ALLOW_SKIP is not set,
  // count it as a failure even though the script exited 0.
  if (script === "verify:runtime-ledger-consistency" && passed) {
    const report = readJsonReport(ledgerConsistencyReportPath);
    if (report?.skipped === true && !process.env.LEDGER_CONSISTENCY_ALLOW_SKIP) {
      passed = false;
      console.error(
        "Release gate: verify:runtime-ledger-consistency was skipped and LEDGER_CONSISTENCY_ALLOW_SKIP is not set. Treating as failure."
      );
    }
  }

  results.push({
    script,
    status: passed ? "passed" : "failed",
    passed,
    exitCode: run.status ?? 1,
    startedAtIso,
    finishedAtIso
  });

  if (!passed) {
    gateFailedEarly = true;
    break;
  }
}

// Fill in "not_run" entries for any checks that never executed due to early exit.
if (gateFailedEarly) {
  const ranScripts = new Set(results.map((item) => item.script));
  for (const script of checks) {
    if (!ranScripts.has(script)) {
      results.push({
        script,
        status: "not_run",
        passed: false,
        exitCode: null,
        startedAtIso: null,
        finishedAtIso: null
      });
    }
  }
}

// Run non-blocking checks only when the gate has not failed early.
const nonBlockingResults = [];

if (!gateFailedEarly) {
  const cloudSmokeScript = "verify:cloud-aws-smoke";
  if (!process.env.E2E_ADMIN_EMAIL) {
    console.log(
      `[release-gate] Skipping non-blocking check ${cloudSmokeScript}: E2E_ADMIN_EMAIL is not set.`
    );
    nonBlockingResults.push({
      script: cloudSmokeScript,
      status: "skipped",
      passed: null,
      exitCode: null,
      startedAtIso: null,
      finishedAtIso: null,
      note: "E2E_ADMIN_EMAIL not set"
    });
  } else {
    const startedAtIso = new Date().toISOString();
    const run = runNpmScript(cloudSmokeScript);
    const finishedAtIso = new Date().toISOString();
    const passed = run.status === 0;

    nonBlockingResults.push({
      script: cloudSmokeScript,
      status: passed ? "passed" : "failed",
      passed,
      exitCode: run.status ?? 1,
      startedAtIso,
      finishedAtIso,
      blocking: false
    });

    if (!passed) {
      console.warn(
        `[release-gate] Non-blocking check ${cloudSmokeScript} failed (exit ${run.status ?? 1}). Gate is not blocked.`
      );
    }
  }
} else {
  // Gate failed before non-blocking checks could run.
  for (const script of nonBlockingChecks) {
    nonBlockingResults.push({
      script,
      status: "not_run",
      passed: false,
      exitCode: null,
      startedAtIso: null,
      finishedAtIso: null
    });
  }
}

const reportPath = resolve("docs", "status", "release-gate-latest.json");
if (!existsSync(dirname(reportPath))) {
  mkdirSync(dirname(reportPath), { recursive: true });
}

const blockingPassed =
  results.length === checks.length &&
  results.every((item) => item.status === "passed");

const payload = {
  generatedAtIso: new Date().toISOString(),
  checks: [...results, ...nonBlockingResults],
  passed: blockingPassed
};

writeFileSync(reportPath, JSON.stringify(payload, null, 2));

if (!payload.passed) {
  console.error(`Release gate failed. Report: ${reportPath}`);
  process.exit(1);
}

console.log(`Release gate passed. Report: ${reportPath}`);
