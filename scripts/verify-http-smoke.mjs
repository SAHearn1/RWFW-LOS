import { spawn } from "node:child_process";

// HTTP smoke spins up `next start` locally. In CI, Clerk middleware makes JWKS network
// calls on startup that stall indefinitely. Skip in any CI environment unless the caller
// explicitly opts in with FORCE_HTTP_SMOKE=true.
// The post-merge E2E job tests the deployed Vercel URL — that is the correct CI coverage.
const inCi = process.env.CI === "true" || process.env.CI === "1";
const forceRun = process.env.FORCE_HTTP_SMOKE === "true";

if (inCi && !forceRun) {
  console.log(
    "HTTP smoke skipped in CI: run locally with FORCE_HTTP_SMOKE=true, " +
    "or use the post-merge E2E job (verify:role-e2e) for deployed-URL coverage."
  );
  process.exit(0);
}

const routes = ["/", "/sign-in", "/app", "/app/studio", "/app/credentials", "/app/evidence", "/app/settings", "/app/exports"];
const baseUrl = "http://127.0.0.1:3000";
const performanceBudgetsMs = {
  "/": 2500,
  "/app": 3000
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const signal = AbortSignal.timeout(2000);
      const response = await fetch(`${baseUrl}/`, { redirect: "manual", signal });
      if (response.status < 600) {
        return;
      }
    } catch {
      // keep polling — timeout or connection refused
    }

    await wait(500);
  }

  throw new Error("Server did not become ready in time.");
}

async function run() {
  const server = process.platform === "win32"
    ? spawn("cmd.exe", ["/c", "npm run start"], { stdio: "pipe", env: process.env })
    : spawn("npm", ["run", "start"], { stdio: "pipe", env: process.env });

  server.stdout.on("data", () => {
    // consume stream
  });
  server.stderr.on("data", () => {
    // consume stream
  });

  try {
    await waitForServer();

    const failures = [];

    const REQUEST_TIMEOUT_MS = 8000;
    for (const route of routes) {
      let response;
      const started = performance.now();
      try {
        const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
        response = await fetch(`${baseUrl}${route}`, { redirect: "manual", signal });
      } catch (error) {
        failures.push(`${route}: request failed (${error.message})`);
        continue;
      }
      const elapsed = performance.now() - started;

      if (response.status >= 500) {
        failures.push(`${route}: returned ${response.status}`);
      }

      const budget = performanceBudgetsMs[route];
      if (budget && elapsed > budget) {
        failures.push(`${route}: exceeded budget (${Math.round(elapsed)}ms > ${budget}ms)`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`HTTP smoke failures:\n${failures.join("\n")}`);
    }

    console.log("HTTP smoke passed:", routes.join(", "));
  } finally {
    server.kill("SIGTERM");
    await wait(500);
    if (!server.killed) {
      server.kill("SIGKILL");
    }
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
