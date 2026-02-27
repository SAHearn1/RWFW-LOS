/**
 * verify-super-admin-e2e.mjs
 *
 * Playwright E2E smoke test for the super_admin role.
 *
 * Verifies that a super_admin user:
 *   • Can access super-admin-only routes (/app/super-admin/*)
 *   • Can access shared all-role routes (/app)
 *   • Is denied learner-only, facilitator-only, and admin-only routes
 *
 * Uses a Clerk sign-in ticket (bypasses the login form) to avoid depending
 * on password-based auth flows.
 *
 * Usage:
 *   npm run verify:super-admin-e2e
 *
 * Required env vars:
 *   CLERK_SECRET_KEY          — Clerk backend secret key
 *   E2E_SUPER_ADMIN_EMAIL     — Email of a super_admin-role Clerk user
 *
 * Optional env vars:
 *   E2E_BASE_URL              — Defaults to http://127.0.0.1:3000
 *
 * If E2E_SUPER_ADMIN_EMAIL is not set the script exits 0 with a skip notice.
 * This keeps CI green when super-admin credentials are not available.
 */
import { mkdirSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { chromium } from "playwright";

loadEnv({ path: ".env.local" });
loadEnv();

const baseUrl = (process.env.E2E_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const clerkSecret = process.env.CLERK_SECRET_KEY;
const superAdminEmail = process.env.E2E_SUPER_ADMIN_EMAIL;

const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
const artifactDir = `docs/qa/artifacts/super-admin-e2e/${timestamp}`;

// Routes the super_admin role must be able to reach
const ALLOW_ROUTES = [
  "/app",
  "/app/super-admin/users",
  "/app/super-admin/teachers",
  "/app/super-admin/licenses",
  "/app/super-admin/institutions",
];

// Routes the super_admin role must NOT be able to reach
// (learner-only, facilitator-only, and admin-only routes)
const DENY_ROUTES = [
  "/app/missions",
  "/app/studio",
  "/app/command-center",
  "/app/evidence",
];

function sanitizeRoute(route) {
  return route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

async function clerkApi(path, options = {}) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`Clerk API ${path} failed (${res.status}): ${text.slice(0, 220)}`);
  }
  return body;
}

async function getUserByEmail(email) {
  const users = await clerkApi(`/users?limit=100&email_address[]=${encodeURIComponent(email)}`);
  const user = users.find((entry) =>
    (entry.email_addresses ?? []).some(
      (e) => e.email_address.toLowerCase() === email.toLowerCase()
    )
  );
  if (!user) {
    throw new Error(`No Clerk user found for ${email}`);
  }
  return user;
}

async function createSignInTicket(userId) {
  const token = await clerkApi("/sign_in_tokens", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 600 }),
  });
  if (!token.token) {
    throw new Error(`Clerk sign-in token was not returned for userId ${userId}`);
  }
  return token.token;
}

async function loginWithTicket(page, ticket) {
  await page.goto(`${baseUrl}/sign-in?__clerk_ticket=${encodeURIComponent(ticket)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForURL((url) => url.pathname.startsWith("/app"), { timeout: 30_000 });
}

async function verifyRoute(page, route, shouldAllow) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  const screenshotPath = `${artifactDir}/super_admin-${sanitizeRoute(route)}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const bodyText = await page.locator("body").innerText();
  const deniedByMessage =
    bodyText.includes("does not have access") || bodyText.includes("Access Restricted");
  const deniedByPath = page.url().includes("/app/forbidden");

  if (shouldAllow) {
    if (response && response.status() >= 500 && bodyText.includes("Application error")) {
      throw new Error(`${route} rendered application error (status ${response.status()})`);
    }
    if (page.url().includes("/sign-in")) {
      throw new Error(`${route} redirected to sign-in for authenticated super_admin`);
    }
    if (deniedByMessage || deniedByPath) {
      throw new Error(`${route} rendered access denied for super_admin — route should be allowed`);
    }
    return;
  }

  // Route should be denied
  if (!deniedByMessage && !deniedByPath) {
    throw new Error(`${route} did not show access denial for super_admin — route should be denied`);
  }
}

async function run() {
  // Graceful skip when credentials are not configured
  if (!superAdminEmail) {
    console.log(
      "verify:super-admin-e2e skipped — E2E_SUPER_ADMIN_EMAIL not set. " +
        "Set it in .env.local with a valid super_admin Clerk user to enable this check."
    );
    return;
  }

  if (!clerkSecret) {
    throw new Error("CLERK_SECRET_KEY is required when E2E_SUPER_ADMIN_EMAIL is set.");
  }

  mkdirSync(artifactDir, { recursive: true });

  const user = await getUserByEmail(superAdminEmail);
  const ticket = await createSignInTicket(user.id);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = [];

  try {
    await loginWithTicket(page, ticket);

    for (const route of ALLOW_ROUTES) {
      try {
        await verifyRoute(page, route, true);
        console.log(`[PASS] allow  ${route}`);
      } catch (err) {
        failures.push(`allow  ${route}: ${err.message ?? String(err)}`);
        console.error(`[FAIL] allow  ${route}: ${err.message ?? String(err)}`);
      }
    }

    for (const route of DENY_ROUTES) {
      try {
        await verifyRoute(page, route, false);
        console.log(`[PASS] deny   ${route}`);
      } catch (err) {
        failures.push(`deny   ${route}: ${err.message ?? String(err)}`);
        console.error(`[FAIL] deny   ${route}: ${err.message ?? String(err)}`);
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(`Artifacts written to ${artifactDir}`);

  if (failures.length > 0) {
    throw new Error(
      `Super-admin E2E failures (${failures.length}):\n${failures.map((f) => `  • ${f}`).join("\n")}`
    );
  }

  console.log("Super-admin E2E smoke passed.");
}

run().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
