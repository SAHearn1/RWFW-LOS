import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const checks = [
  "lint",
  "typecheck",
  "build",
  "verify:env",
  "verify:env-parity",
  "verify:role-routes",
  "verify:runtime-routes",
  "verify:onboarding",
  "verify:http-smoke"
];

function runNpmScript(script) {
  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", `npm run ${script}`], { stdio: "inherit" });
  }

  return spawnSync("npm", ["run", script], { stdio: "inherit" });
}

const results = [];

for (const script of checks) {
  const startedAtIso = new Date().toISOString();
  const run = runNpmScript(script);
  const finishedAtIso = new Date().toISOString();
  const passed = run.status === 0;

  results.push({
    script,
    passed,
    exitCode: run.status ?? 1,
    startedAtIso,
    finishedAtIso
  });

  if (!passed) {
    break;
  }
}

const reportPath = resolve("docs", "status", "release-gate-latest.json");
if (!existsSync(dirname(reportPath))) {
  mkdirSync(dirname(reportPath), { recursive: true });
}

const payload = {
  generatedAtIso: new Date().toISOString(),
  checks: results,
  passed: results.length === checks.length && results.every((item) => item.passed)
};

writeFileSync(reportPath, JSON.stringify(payload, null, 2));

if (!payload.passed) {
  console.error(`Release gate failed. Report: ${reportPath}`);
  process.exit(1);
}

console.log(`Release gate passed. Report: ${reportPath}`);
