import { mkdirSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { chromium } from "playwright";

loadEnv({ path: ".env.local" });
loadEnv();

const baseUrl = (process.env.E2E_BASE_URL || "https://rwfw-los.vercel.app").replace(/\/$/, "");
const clerkSecret = process.env.CLERK_SECRET_KEY;
const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
const artifactDir = `docs/qa/artifacts/role-e2e/${timestamp}`;

const roleConfigs = [
  {
    role: "student_independent",
    emailEnv: "E2E_STUDENT_INDEPENDENT_EMAIL",
    allowRoutes: ["/app", "/app/studio", "/app/credentials", "/app/missions", "/app/portfolio", "/app/core", "/app/settings"],
    denyRoutes: ["/app/command-center", "/app/evidence", "/app/exports", "/app/pickups"]
  },
  {
    role: "student_enrolled",
    emailEnv: "E2E_STUDENT_ENROLLED_EMAIL",
    allowRoutes: ["/app", "/app/studio", "/app/credentials", "/app/missions", "/app/portfolio", "/app/core", "/app/settings"],
    denyRoutes: ["/app/command-center", "/app/evidence", "/app/exports", "/app/pickups"]
  },
  {
    role: "adult_learner",
    emailEnv: "E2E_ADULT_LEARNER_EMAIL",
    allowRoutes: ["/app", "/app/studio", "/app/credentials", "/app/missions", "/app/portfolio", "/app/core", "/app/settings"],
    denyRoutes: ["/app/command-center", "/app/evidence", "/app/exports", "/app/pickups"]
  },
  {
    role: "teacher",
    emailEnv: "E2E_TEACHER_EMAIL",
    allowRoutes: ["/app", "/app/command-center", "/app/cohorts", "/app/reviews", "/app/pickups", "/app/core"],
    denyRoutes: ["/app/studio", "/app/credentials", "/app/evidence", "/app/portfolio", "/app/settings"]
  },
  {
    role: "professional_development",
    emailEnv: "E2E_PROFESSIONAL_DEVELOPMENT_EMAIL",
    allowRoutes: ["/app", "/app/command-center", "/app/cohorts", "/app/reviews", "/app/pickups", "/app/core"],
    denyRoutes: ["/app/studio", "/app/credentials", "/app/evidence", "/app/portfolio", "/app/settings"]
  },
  {
    role: "admin",
    emailEnv: "E2E_ADMIN_EMAIL",
    allowRoutes: ["/app", "/app/evidence", "/app/exports", "/app/standards", "/app/core"],
    denyRoutes: ["/app/studio", "/app/command-center", "/app/cohorts", "/app/portfolio", "/app/pickups", "/app/settings"]
  },
  {
    // REQUIRED for production readiness: provision a super_admin account in the Clerk production instance.
    // Set E2E_SUPER_ADMIN_EMAIL + E2E_SUPER_ADMIN_PASSWORD in GitHub Secrets after completing issue #161.
    // Until those credentials are set, the test emits a visible error-level warning and skips gracefully.
    role: "super_admin",
    emailEnv: "E2E_SUPER_ADMIN_EMAIL",
    warnIfMissing: true,
    allowRoutes: ["/app", "/app/super-admin", "/app/evidence", "/app/exports", "/app/standards", "/app/settings"],
    denyRoutes: ["/app/missions", "/app/studio", "/app/command-center", "/app/cohorts", "/app/reviews"]
  }
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
      ...(options.headers || {})
    }
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
    (entry.email_addresses || []).some((emailEntry) => emailEntry.email_address.toLowerCase() === email.toLowerCase())
  );
  if (!user) {
    throw new Error(`No Clerk user found for ${email}`);
  }
  return user;
}

async function createSignInTicket(userId) {
  const token = await clerkApi("/sign_in_tokens", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 600 })
  });

  if (!token.token) {
    throw new Error(`Clerk sign-in token was not returned for ${userId}`);
  }

  return token.token;
}

async function checkOrganizationsEnabled() {
  try {
    await clerkApi("/organizations?limit=1");
    return true;
  } catch (error) {
    return !String(error.message || error).includes("organization_not_enabled_in_instance");
  }
}

async function loginWithTicket(page, ticket) {
  await page.goto(`${baseUrl}/sign-in?__clerk_ticket=${encodeURIComponent(ticket)}`, { waitUntil: "networkidle" });
  await page.waitForURL((url) => url.pathname.startsWith("/app"), { timeout: 30000 });
}

async function verifyRoute(page, role, route, shouldAllow, options = {}) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  const screenshotPath = `${artifactDir}/${role}-${sanitizeRoute(route)}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const bodyText = await page.locator("body").innerText();
  const deniedByMessage = bodyText.includes("does not have access") || bodyText.includes("Access Restricted");
  const orgBlocked = bodyText.includes("organization assignment is required");

  if (shouldAllow) {
    if (options.allowOrgBlocked && orgBlocked) {
      return { orgBlocked: true };
    }

    if (response && response.status() >= 500 && bodyText.includes("Application error")) {
      throw new Error(`${route} rendered application error with status ${response.status()}`);
    }
    if (page.url().includes("/sign-in")) {
      throw new Error(`${route} redirected to sign-in for authenticated role ${role}`);
    }
    if (deniedByMessage) {
      throw new Error(`${route} rendered access denied content for role ${role}`);
    }

    return { orgBlocked: false };
  }

  const deniedByPath = page.url().includes("/app/forbidden");
  if (!deniedByMessage && !deniedByPath) {
    throw new Error(`${route} did not show access denial for role ${role}`);
  }

  return { orgBlocked: false };
}

async function run() {
  if (!clerkSecret) {
    throw new Error("CLERK_SECRET_KEY is required for role E2E ticket mode.");
  }

  const missing = [];
  for (const config of roleConfigs) {
    if (!process.env[config.emailEnv]) {
      if (config.optional) {
        console.warn(`[SKIP] ${config.role}: ${config.emailEnv} not set — skipping optional role test.`);
      } else if (config.warnIfMissing) {
        console.error(
          `[REQUIRED - MISSING] ${config.role}: ${config.emailEnv} is not set.\n` +
          `  This role MUST be tested before production launch.\n` +
          `  Provision a Clerk production account and set ${config.emailEnv} to enable this test.\n` +
          `  See issue #161 (Clerk production key rotation) and issue #169.`
        );
      } else {
        missing.push(config.emailEnv);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required E2E env vars: ${missing.join(", ")}`);
  }

  mkdirSync(artifactDir, { recursive: true });

  const organizationsEnabled = await checkOrganizationsEnabled();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const config of roleConfigs) {
      const email = process.env[config.emailEnv];
      if (!email && (config.optional || config.warnIfMissing)) {
        continue;
      }
      const user = await getUserByEmail(email);
      const ticket = await createSignInTicket(user.id);

      const context = await browser.newContext();
      const page = await context.newPage();
      const outcome = { role: config.role, status: "pass", notes: [] };

      try {
        await loginWithTicket(page, ticket);

        for (const route of config.allowRoutes) {
          const check = await verifyRoute(page, config.role, route, true, {
            allowOrgBlocked: (config.role === "teacher" || config.role === "professional_development" || config.role === "admin" || config.role === "super_admin") && !organizationsEnabled
          });
          if (check.orgBlocked) {
            outcome.notes.push(`org-blocked:${route}`);
          }
        }

        for (const route of config.denyRoutes) {
          await verifyRoute(page, config.role, route, false);
        }

        if (outcome.notes.some((note) => note.startsWith("org-blocked:"))) {
          outcome.status = "partial";
        }
      } catch (error) {
        outcome.status = "fail";
        outcome.error = error.message || String(error);
      } finally {
        await context.close();
      }

      results.push(outcome);
    }
  } finally {
    await browser.close();
  }

  console.log(`Artifacts written to ${artifactDir}`);
  for (const result of results) {
    if (result.status === "pass") {
      console.log(`[PASS] ${result.role}`);
    } else if (result.status === "partial") {
      console.log(`[PARTIAL] ${result.role}: ${result.notes.join(",")}`);
    } else {
      console.error(`[FAIL] ${result.role}: ${result.error}`);
    }
  }

  if (!organizationsEnabled) {
    console.log("[GAP] Clerk Organizations feature is disabled; teacher/admin flows require org enablement.");
  }

  const failures = results.filter((result) => result.status === "fail");
  if (failures.length > 0) {
    throw new Error(`${failures.length} role smoke checks failed.`);
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});