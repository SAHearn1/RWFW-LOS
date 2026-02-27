/**
 * verify:health-check
 *
 * Hits /api/health on the configured base URL and validates the response shape.
 * Passes as long as the endpoint returns a parseable JSON body with `status` and
 * `checks`; individual service checks may be "unconfigured" or "error" without
 * blocking this gate (those are environment concerns, not code concerns).
 *
 * Set ROOTWORK_SYNTHETIC_BASE_URL (or falls back to http://localhost:3000).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const baseUrl = (process.env.ROOTWORK_SYNTHETIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const url = `${baseUrl}/api/health`;

const reportDir = resolve("docs", "status");
const reportPath = resolve(reportDir, "health-check-latest.json");

async function run() {
  console.log(`[health-check] GET ${url}`);

  let body;
  let statusCode;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    statusCode = res.status;
    const text = await res.text();
    body = JSON.parse(text);
  } catch (err) {
    const report = {
      generatedAtIso: new Date().toISOString(),
      url,
      passed: false,
      error: String(err)
    };
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.error(`[health-check] Request failed: ${err.message || err}`);
    process.exit(1);
  }

  const passed =
    typeof body === "object" &&
    body !== null &&
    typeof body.status === "string" &&
    typeof body.checks === "object";

  const report = {
    generatedAtIso: new Date().toISOString(),
    url,
    statusCode,
    overallStatus: body?.status,
    checks: body?.checks,
    passed
  };

  mkdirSync(reportDir, { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (!passed) {
    console.error(`[health-check] Unexpected response shape (HTTP ${statusCode}):`, body);
    process.exit(1);
  }

  const checks = body.checks ?? {};
  for (const [name, result] of Object.entries(checks)) {
    const status = result?.status ?? "unknown";
    const detail = result?.detail ? ` — ${result.detail}` : "";
    const latency = result?.latencyMs != null ? ` (${result.latencyMs}ms)` : "";
    if (status === "error") {
      console.warn(`[health-check] [WARN] ${name}: ${status}${latency}${detail}`);
    } else {
      console.log(`[health-check] ${name}: ${status}${latency}${detail}`);
    }
  }

  console.log(`[health-check] Overall: ${body.status} (HTTP ${statusCode})`);
  console.log(`[health-check] Report written to ${reportPath}`);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
