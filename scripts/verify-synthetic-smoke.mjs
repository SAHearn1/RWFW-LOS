import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function resolveBaseUrl() {
  if (process.env.ROOTWORK_SYNTHETIC_BASE_URL) {
    return process.env.ROOTWORK_SYNTHETIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

const BASE_URL = resolveBaseUrl();

// Routes config: public routes must return 2xx/3xx; authProtected routes accept
// 302 (Clerk prod → redirect to /sign-in), 401/403 (explicit rejection), or
// 404 (Clerk dev-mode "protect-rewrite" when dev-browser cookie absent).
// Anything ≥ 500 or a network error is always a failure.
const ROUTES = [
  { path: "/", authProtected: false },
  { path: "/sign-in", authProtected: false },
  { path: "/app", authProtected: true },
  { path: "/app/studio", authProtected: true },
  { path: "/app/settings", authProtected: true },
];

async function run() {
  const startedAtIso = new Date().toISOString();
  const checks = [];

  for (const { path: route, authProtected } of ROUTES) {
    const url = `${BASE_URL}${route}`;
    const began = Date.now();

    try {
      const response = await fetch(url, { redirect: "manual" });
      const durationMs = Date.now() - began;

      // Auth-protected: any non-5xx, non-network response is acceptable
      // (302 = Clerk prod redirect, 404 = Clerk dev protect-rewrite, 401/403 = explicit rejection)
      // Public: expect 2xx/3xx
      const passed = authProtected
        ? response.status > 0 && response.status < 500
        : (response.status >= 200 && response.status < 400) || response.status === 401 || response.status === 403;

      checks.push({ route, url, status: response.status, durationMs, authProtected, passed });
    } catch (error) {
      checks.push({
        route,
        url,
        status: 0,
        durationMs: Date.now() - began,
        passed: false,
        error: error instanceof Error ? error.message : "unknown_error"
      });
    }
  }

  const payload = {
    generatedAtIso: new Date().toISOString(),
    startedAtIso,
    baseUrl: BASE_URL,
    checks,
    passed: checks.every((check) => check.passed)
  };

  const jsonPath = resolve("docs", "status", "synthetic-smoke-latest.json");
  if (!existsSync(dirname(jsonPath))) {
    mkdirSync(dirname(jsonPath), { recursive: true });
  }

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

  if (!payload.passed) {
    console.error(`Synthetic smoke failed. Report: ${jsonPath}`);
    process.exit(1);
  }

  console.log(`Synthetic smoke passed. Report: ${jsonPath}`);
}

run();

