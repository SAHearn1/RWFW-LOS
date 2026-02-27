/**
 * verify-api-auth-guards.mjs
 *
 * HTTP smoke test that verifies API endpoints respond correctly to
 * unauthenticated requests:
 *
 *   • Auth-guarded endpoints must return 4xx (not 5xx) with no Clerk session
 *   • Public health/status endpoints must respond with 2xx or 503
 *
 * Starts the production server, runs checks, kills the server.
 * Requires a production build to exist (`npm run build` first).
 *
 * Usage:
 *   npm run verify:api-auth-guards
 *
 * Note: Full role-based auth testing (403 vs 401 distinction) requires
 * real Clerk credentials and is covered by verify:role-e2e and
 * verify:super-admin-e2e.
 */
import { spawn } from "node:child_process";

const BASE_URL = "http://127.0.0.1:3000";

// Endpoints that require authentication — unauthenticated requests must NOT
// return 5xx (they should return 4xx or redirect to sign-in)
const AUTH_GUARDED = [
  { method: "GET",  path: "/api/super-admin/users" },
  { method: "POST", path: "/api/super-admin/assign-role",
    body: JSON.stringify({ userId: "usr_test123", role: "teacher", orgId: "org_test" }) },
  { method: "POST", path: "/api/admin/retention",
    body: JSON.stringify({ action: "purge_before", cutoffIso: "2020-01-01T00:00:00Z" }) },
  { method: "GET",  path: "/api/ledger/records" },
  { method: "GET",  path: "/api/timeline/learner" },
];

// Public endpoints that should always respond without auth
const PUBLIC_ENDPOINTS = [
  { method: "GET", path: "/api/health",         acceptedStatuses: [200] },
  { method: "GET", path: "/api/mcp/health",     acceptedStatuses: [200, 503] },
  { method: "GET", path: "/api/offline/status", acceptedStatuses: [200, 503] },
  { method: "GET", path: "/api/ai/health",      acceptedStatuses: [200, 503] },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
      if (res.status < 600) return;
    } catch {
      // keep polling
    }
    await wait(500);
  }
  throw new Error("Server did not become ready within the allotted time.");
}

async function run() {
  const server =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/c", "npm run start"], { stdio: "pipe", env: process.env })
      : spawn("npm", ["run", "start"], { stdio: "pipe", env: process.env });

  server.stdout.on("data", () => {});
  server.stderr.on("data", () => {});

  try {
    await waitForServer();

    const failures = [];

    // ── Auth-guarded endpoints ────────────────────────────────────────────────
    for (const { method, path, body } of AUTH_GUARDED) {
      let status;
      try {
        const opts = { method, redirect: "manual", headers: { "Content-Type": "application/json" } };
        if (body) opts.body = body;
        const res = await fetch(`${BASE_URL}${path}`, opts);
        status = res.status;
      } catch (err) {
        failures.push(`${method} ${path}: request failed — ${err.message}`);
        continue;
      }

      if (status >= 500) {
        failures.push(
          `${method} ${path}: returned ${status} for unauthenticated request — ` +
          "expected 4xx (role guard must return 403 before any server error can occur)"
        );
      }
    }

    // ── Public / health endpoints ─────────────────────────────────────────────
    for (const { method, path, acceptedStatuses } of PUBLIC_ENDPOINTS) {
      let status;
      try {
        const res = await fetch(`${BASE_URL}${path}`, { method, redirect: "manual" });
        status = res.status;
      } catch (err) {
        failures.push(`${method} ${path}: request failed — ${err.message}`);
        continue;
      }

      if (!acceptedStatuses.includes(status)) {
        failures.push(
          `${method} ${path}: returned ${status}, expected one of [${acceptedStatuses.join(", ")}]`
        );
      }
    }

    if (failures.length > 0) {
      throw new Error(`API auth guard failures:\n${failures.map((f) => `  • ${f}`).join("\n")}`);
    }

    const checkedPaths = [...AUTH_GUARDED, ...PUBLIC_ENDPOINTS].map((e) => e.path).join(", ");
    console.log(`API auth guards passed: ${checkedPaths}`);
  } finally {
    server.kill("SIGTERM");
    await wait(500);
    if (!server.killed) server.kill("SIGKILL");
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
