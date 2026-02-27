/**
 * verify-role-ux-full.mjs
 *
 * Comprehensive role UX end-to-end test. Tests 5 layers per role using a real
 * browser (Playwright) and real Clerk authentication via sign-in tickets.
 *
 * LAYER 1 — Route access control
 *   Each role can reach its allowed routes and is blocked from forbidden routes.
 *
 * LAYER 2 — Role identity
 *   Correct dashboard renders (not another role's), nav contains exactly the
 *   right links, role label is shown in the header.
 *
 * LAYER 3 — Behavioral completeness
 *   Real user actions produce real effects. Checks whether core interactions
 *   actually work vs. silently do nothing due to missing flags or missing
 *   backend wiring.
 *
 * LAYER 4 — Hardcoded / demo data detection
 *   Known fake strings embedded in components are detected and flagged as
 *   HARDCODED failures. A PASS here means no fake data was found.
 *
 * LAYER 5 — Cross-role data flow
 *   A learner saves an artifact, then a teacher views the review queue. The
 *   test asserts the artifact appears. This WILL FAIL if the learner→teacher
 *   data pipe is not implemented — which is the honest result.
 *
 * Status codes:
 *   PASS       — Behaves correctly as specified
 *   FAIL       — Incorrect behavior or unhandled error
 *   HARDCODED  — Known fake/demo data found where real data is expected
 *   STUB       — Feature placeholder: action completes with no durable effect
 *   SKIP       — Skipped (missing credentials or prerequisite)
 *
 * Exit code: 0 only when every non-SKIP result is PASS.
 * Any FAIL, HARDCODED, or STUB causes exit 1.
 *
 * Required env vars (.env.local or .env):
 *   CLERK_SECRET_KEY
 *   E2E_BASE_URL                        (default: http://localhost:3000)
 *   E2E_STUDENT_INDEPENDENT_EMAIL       (+ optional other role emails)
 *   E2E_TEACHER_EMAIL
 *   E2E_ADMIN_EMAIL
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { chromium } from "playwright";

loadEnv({ path: ".env.local" });
loadEnv();

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const TIMESTAMP = new Date().toISOString().replace(/[.:]/g, "-");
const ARTIFACT_DIR = `docs/qa/artifacts/role-ux-full/${TIMESTAMP}`;

// Every string in this list is evidence of hardcoded demo data in the rendered
// UI. Any match is an automatic HARDCODED failure — the component is not
// connected to real data.
const HARDCODED_STRINGS = [
  // ReviewQueue.tsx — fake learner artifacts
  "Mission Reflection: Community Impact",
  "Artifact: Systems Thinking Analysis",
  "Mission Draft: Learning Pathways",
  "Alex Rivera",
  "Jordan Lee",
  "Sam Patel",
  "Live submissions will populate from the ledger when enabled",
  // CohortList.tsx — fake cohort names
  "Demo Cohort A",
  "Demo Cohort B",
  "Spring Cohort",
  "Cohort data will populate from your assigned groups",
];

// Placeholder text patterns — evidence of STUB (no implementation, not fake
// data per se, but a deliberate not-yet-wired message).
const STUB_PATTERNS = [
  /will populate from/i,
  /coming soon/i,
  /not yet implemented/i,
  /placeholder/i,
];

// ── Role configurations ───────────────────────────────────────────────────────

const ROLE_CONFIGS = [
  {
    role: "student_independent",
    emailEnv: "E2E_STUDENT_INDEPENDENT_EMAIL",
    allowRoutes: ["/app", "/app/missions", "/app/studio", "/app/credentials", "/app/settings", "/app/portfolio"],
    denyRoutes: ["/app/command-center", "/app/evidence", "/app/exports", "/app/standards"],
    expectedNavLabels: ["Studio", "Missions", "Credentials"],
    forbiddenNavLabels: ["Command Center", "Evidence", "Exports"],
    dashboardDataTour: "mission-draft",
    expectedRoleLabelFragment: "student_independent",
    hardcodedScanRoutes: ["/app", "/app/missions", "/app/studio", "/app/credentials", "/app/portfolio"],
    behaviorType: "learner",
  },
  {
    role: "student_enrolled",
    emailEnv: "E2E_STUDENT_ENROLLED_EMAIL",
    allowRoutes: ["/app", "/app/missions", "/app/studio", "/app/credentials"],
    denyRoutes: ["/app/command-center", "/app/evidence", "/app/exports"],
    expectedNavLabels: ["Studio", "Missions"],
    forbiddenNavLabels: ["Command Center", "Evidence"],
    dashboardDataTour: "mission-draft",
    expectedRoleLabelFragment: "student_enrolled",
    hardcodedScanRoutes: ["/app", "/app/studio"],
    behaviorType: "learner",
  },
  {
    role: "adult_learner",
    emailEnv: "E2E_ADULT_LEARNER_EMAIL",
    allowRoutes: ["/app", "/app/missions", "/app/studio", "/app/credentials"],
    denyRoutes: ["/app/command-center", "/app/evidence", "/app/exports"],
    expectedNavLabels: ["Studio", "Missions"],
    forbiddenNavLabels: ["Command Center", "Evidence"],
    dashboardDataTour: "page-title",
    expectedRoleLabelFragment: "adult_learner",
    hardcodedScanRoutes: ["/app", "/app/studio"],
    behaviorType: "learner",
  },
  {
    role: "teacher",
    emailEnv: "E2E_TEACHER_EMAIL",
    allowRoutes: ["/app", "/app/command-center", "/app/cohorts", "/app/reviews", "/app/builder"],
    denyRoutes: ["/app/studio", "/app/missions", "/app/evidence", "/app/exports"],
    expectedNavLabels: ["Command Center", "Cohorts", "Reviews", "Builder"],
    forbiddenNavLabels: ["Studio", "Missions", "Evidence"],
    dashboardDataTour: "page-title",
    expectedRoleLabelFragment: "teacher",
    hardcodedScanRoutes: ["/app", "/app/reviews", "/app/cohorts", "/app/builder"],
    behaviorType: "teacher",
  },
  {
    role: "professional_development",
    emailEnv: "E2E_PROFESSIONAL_DEVELOPMENT_EMAIL",
    allowRoutes: ["/app", "/app/command-center", "/app/cohorts", "/app/reviews"],
    denyRoutes: ["/app/studio", "/app/missions", "/app/evidence"],
    expectedNavLabels: ["Command Center", "Cohorts", "Reviews"],
    forbiddenNavLabels: ["Studio", "Missions"],
    dashboardDataTour: "page-title",
    expectedRoleLabelFragment: "professional_development",
    hardcodedScanRoutes: ["/app", "/app/reviews", "/app/cohorts"],
    behaviorType: "teacher",
  },
  {
    role: "admin",
    emailEnv: "E2E_ADMIN_EMAIL",
    allowRoutes: ["/app", "/app/evidence", "/app/exports", "/app/standards"],
    denyRoutes: ["/app/studio", "/app/command-center", "/app/cohorts", "/app/missions"],
    expectedNavLabels: ["Evidence", "Exports", "Standards"],
    forbiddenNavLabels: ["Studio", "Command Center", "Missions"],
    dashboardDataTour: "page-title",
    expectedRoleLabelFragment: "admin",
    hardcodedScanRoutes: ["/app", "/app/evidence", "/app/exports", "/app/standards"],
    behaviorType: "admin",
  },
];

// ── Result tracking ───────────────────────────────────────────────────────────

const results = [];

function record(layer, role, check, status, detail = "") {
  const entry = { layer, role, check, status, detail };
  results.push(entry);
  const icons = { PASS: "✓", FAIL: "✗", HARDCODED: "⚠ HARDCODED", STUB: "⚠ STUB", SKIP: "–" };
  const icon = icons[status] ?? status;
  const suffix = detail ? `  →  ${detail}` : "";
  console.log(`    [${icon}] L${layer} ${check}${suffix}`);
}

// ── Clerk API helpers ─────────────────────────────────────────────────────────

async function clerkApi(path, options = {}) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Clerk API ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function getUserByEmail(email) {
  const users = await clerkApi(`/users?limit=100&email_address[]=${encodeURIComponent(email)}`);
  const user = users.find((u) =>
    (u.email_addresses ?? []).some((e) => e.email_address.toLowerCase() === email.toLowerCase())
  );
  if (!user) throw new Error(`No Clerk user found for ${email}`);
  return user;
}

async function createSignInTicket(userId) {
  const token = await clerkApi("/sign_in_tokens", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 600 }),
  });
  if (!token?.token) throw new Error(`Sign-in token not returned for ${userId}`);
  return token.token;
}

// ── Browser helpers ───────────────────────────────────────────────────────────

async function loginWithTicket(page, ticket) {
  await page.goto(`${BASE_URL}/sign-in?__clerk_ticket=${encodeURIComponent(ticket)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForURL((url) => url.pathname.startsWith("/app"), { timeout: 30_000 });
  await page.waitForTimeout(800);
}

async function bodyText(page) {
  return page.locator("body").innerText().catch(() => "");
}

// ── Layer 1: Route access control ─────────────────────────────────────────────

async function runLayer1(page, config, shot) {
  const { role, allowRoutes, denyRoutes } = config;

  for (const route of allowRoutes) {
    try {
      const res = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      const url = page.url();
      const text = await bodyText(page);
      const blockedToSignIn = url.includes("/sign-in");
      const blockedToForbidden = url.includes("/app/forbidden")
        || text.includes("Access Restricted")
        || text.includes("does not have access");
      const serverCrash = res && res.status() >= 500;
      const orgRequired = text.includes("organization assignment is required");

      if (serverCrash) {
        record(1, role, `allow ${route}`, "FAIL", `HTTP ${res.status()}`);
      } else if (blockedToSignIn) {
        record(1, role, `allow ${route}`, "FAIL", "Redirected to sign-in — session lost");
      } else if (blockedToForbidden && !orgRequired) {
        record(1, role, `allow ${route}`, "FAIL", "Got access-denied on an allowed route");
      } else if (orgRequired) {
        // Org not configured in test environment — skip gracefully
        record(1, role, `allow ${route}`, "SKIP", "org assignment required — Clerk org not configured in test env");
      } else {
        record(1, role, `allow ${route}`, "PASS");
      }
    } catch (err) {
      record(1, role, `allow ${route}`, "FAIL", err.message);
    }
    await shot(`L1-allow${route.replace(/\//g, "-")}`);
  }

  for (const route of denyRoutes) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      const url = page.url();
      const text = await bodyText(page);
      const denied = url.includes("/app/forbidden")
        || text.includes("Access Restricted")
        || text.includes("does not have access");

      if (denied) {
        record(1, role, `deny ${route}`, "PASS");
      } else {
        record(1, role, `deny ${route}`, "FAIL", `Expected 403, landed at ${url}`);
      }
    } catch (err) {
      record(1, role, `deny ${route}`, "FAIL", err.message);
    }
    await shot(`L1-deny${route.replace(/\//g, "-")}`);
  }
}

// ── Layer 2: Role identity ────────────────────────────────────────────────────

async function runLayer2(page, config, shot) {
  const { role, dashboardDataTour, expectedNavLabels, forbiddenNavLabels, expectedRoleLabelFragment } = config;

  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  // 2a. Correct dashboard marker is in the DOM
  const markerCount = await page.locator(`[data-tour="${dashboardDataTour}"]`).count();
  if (markerCount > 0) {
    record(2, role, `dashboard marker [data-tour="${dashboardDataTour}"]`, "PASS");
  } else {
    record(2, role, `dashboard marker [data-tour="${dashboardDataTour}"]`, "FAIL", "Element not found in DOM — wrong dashboard may be rendering");
  }

  // 2b. Role label is visible in header
  // AppShell renders: <p className="text-xs text-slate-600">Role: {role}</p>
  const text = await bodyText(page);
  if (text.includes(`Role: ${expectedRoleLabelFragment}`)) {
    record(2, role, "role label in header", "PASS", `Found "Role: ${expectedRoleLabelFragment}"`);
  } else {
    record(2, role, "role label in header", "FAIL", `"Role: ${expectedRoleLabelFragment}" not found in header`);
  }

  // 2c. Expected nav links are present (by link text)
  for (const label of expectedNavLabels) {
    const found = await page
      .locator(`[data-tour="primary-nav"] a:has-text("${label}")`)
      .count();
    if (found > 0) {
      record(2, role, `nav has "${label}"`, "PASS");
    } else {
      record(2, role, `nav has "${label}"`, "FAIL", `Nav link "${label}" not found`);
    }
  }

  // 2d. Forbidden nav links are absent
  for (const label of forbiddenNavLabels) {
    const found = await page
      .locator(`[data-tour="primary-nav"] a:has-text("${label}")`)
      .count();
    if (found === 0) {
      record(2, role, `nav excludes "${label}"`, "PASS");
    } else {
      record(2, role, `nav excludes "${label}"`, "FAIL", `Forbidden nav link "${label}" is visible`);
    }
  }

  await shot("L2-identity");
}

// ── Layer 3: Behavioral completeness ─────────────────────────────────────────

async function runLayer3Learner(page, role, shot) {
  // 3a. Mission draft textarea accepts input and persists to localStorage
  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const draftTextarea = page.locator(`[data-tour="mission-draft"] textarea`);
  if (await draftTextarea.count() > 0) {
    const testText = "E2E test mission: understanding community systems and outcomes";
    await draftTextarea.fill(testText);
    await page.waitForTimeout(400);
    const value = await draftTextarea.inputValue();
    if (value === testText) {
      // Verify localStorage was updated
      const stored = await page.evaluate((key) => window.localStorage.getItem(key), "rootwork.core.session");
      const hasInStorage = stored && stored.includes("community systems");
      if (hasInStorage) {
        record(3, role, "mission-draft input + localStorage persist", "PASS");
      } else {
        record(3, role, "mission-draft input + localStorage persist", "FAIL", "Text entered but not found in localStorage");
      }
    } else {
      record(3, role, "mission-draft input + localStorage persist", "FAIL", "Text not retained in textarea after fill");
    }
  } else {
    record(3, role, "mission-draft input + localStorage persist", "FAIL", "[data-tour='mission-draft'] textarea not found");
  }
  await shot("L3-mission-draft");

  // 3b. Studio save button — check if enabled and whether save produces a result
  await page.goto(`${BASE_URL}/app/studio`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const artifactTextarea = page.locator(`[data-tour="studio-artifact"] textarea`);
  const saveBtn = page.locator(`[data-tour="artifact-save"]`);

  if (await artifactTextarea.count() === 0) {
    record(3, role, "studio artifact editor present", "FAIL", "[data-tour='studio-artifact'] textarea not found");
  } else if (await saveBtn.count() === 0) {
    record(3, role, "studio save button present", "FAIL", "[data-tour='artifact-save'] button not found");
  } else {
    const isDisabled = await saveBtn.isDisabled();
    if (isDisabled) {
      // Button exists but is disabled — flags are off, save has no effect
      record(3, role, "studio artifact save", "STUB",
        "Save button is disabled — NEXT_PUBLIC_ENABLE_RUNTIME and NEXT_PUBLIC_ENABLE_LEDGER are both false; artifact is never persisted");
    } else {
      // Button is enabled — attempt a real save
      await artifactTextarea.fill("This artifact demonstrates goal-setting, evidence of outcomes, and reflects on learning improvements.");
      await page.waitForTimeout(300);

      // Capture the verification summary before save
      const verificationBefore = await page.locator(`[data-tour="verification-summary"]`).innerText().catch(() => "");

      // Intercept ledger API call
      let ledgerApiCalled = false;
      page.on("response", (res) => {
        if (res.url().includes("/api/ledger/records") && res.request().method() === "POST") {
          ledgerApiCalled = true;
        }
      });

      await saveBtn.click();
      await page.waitForTimeout(1500);

      const verificationAfter = await page.locator(`[data-tour="verification-summary"]`).innerText().catch(() => "");
      const verificationChanged = verificationAfter !== verificationBefore
        && !verificationAfter.includes("No verification recorded yet");

      if (verificationChanged) {
        record(3, role, "studio artifact save → verification result", "PASS", verificationAfter.slice(0, 80));
      } else {
        record(3, role, "studio artifact save → verification result", "FAIL",
          "Clicked save but verification summary did not update from default");
      }

      if (ledgerApiCalled) {
        record(3, role, "studio save → ledger API POST", "PASS");
      } else {
        record(3, role, "studio save → ledger API POST", "STUB",
          "Save did not POST to /api/ledger/records — artifact stored in localStorage only (lost on server restart)");
      }
    }
  }
  await shot("L3-studio-save");

  // 3c. Credentials page shows a count (0 or more — both honest; crash or missing is not)
  await page.goto(`${BASE_URL}/app/credentials`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const credText = await bodyText(page);
  const hasNumericContent = /\d+/.test(credText);
  const hasCrash = credText.includes("Application error") || credText.includes("Error:");
  if (hasCrash) {
    record(3, role, "credentials page renders without crash", "FAIL", "Application error on credentials page");
  } else if (hasNumericContent) {
    record(3, role, "credentials page renders count", "PASS");
  } else {
    record(3, role, "credentials page renders count", "FAIL", "No numeric content found on credentials page");
  }
  await shot("L3-credentials");
}

async function runLayer3Teacher(page, role, shot) {
  // 3a. Builder form: submit creates NO API call (STUB), data gone after reload
  await page.goto(`${BASE_URL}/app/builder`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const missionTitle = page.locator("#mission-title");
  const createMissionBtn = page.locator(`button:has-text("Create Mission")`);

  if (await missionTitle.count() > 0 && await createMissionBtn.count() > 0) {
    const uniqueTitle = `E2E-${Date.now()}`;
    await missionTitle.fill(uniqueTitle);

    let apiCallMade = false;
    page.on("request", (req) => {
      if (req.url().includes("/api/") && req.method() === "POST") apiCallMade = true;
    });

    await createMissionBtn.click();
    await page.waitForTimeout(800);

    const textAfterClick = await bodyText(page);
    const showsSuccess = textAfterClick.includes(`Mission "${uniqueTitle}"`);

    if (!apiCallMade && showsSuccess) {
      // Success message is client-side only — reload will erase it
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      const textAfterReload = await bodyText(page);
      if (!textAfterReload.includes(uniqueTitle)) {
        record(3, role, "builder mission create persists", "STUB",
          "Success shown client-side but no API called — data lost on reload; teacher cannot see created missions later");
      } else {
        record(3, role, "builder mission create persists", "PASS");
      }
    } else if (apiCallMade) {
      record(3, role, "builder mission create persists", "PASS", "API call made");
    } else {
      record(3, role, "builder mission create persists", "FAIL", "No success message shown after submit");
    }
  } else {
    record(3, role, "builder form present", "FAIL", "#mission-title or Create Mission button not found");
  }
  await shot("L3-builder");

  // 3b. Review queue: check whether it shows any content
  await page.goto(`${BASE_URL}/app/reviews`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const reviewText = await bodyText(page);
  const hasCrash = reviewText.includes("Application error");
  if (hasCrash) {
    record(3, role, "reviews page renders", "FAIL", "Application error");
  } else {
    record(3, role, "reviews page renders", "PASS");
  }
  await shot("L3-reviews");
}

async function runLayer3Admin(page, role, shot) {
  // 3a. Evidence page — distinguish real data, zero state, and stub placeholder
  await page.goto(`${BASE_URL}/app/evidence`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const evidenceText = await bodyText(page);
  const isStub = STUB_PATTERNS.some((p) => p.test(evidenceText));
  const hasCrash = evidenceText.includes("Application error");
  if (hasCrash) {
    record(3, role, "evidence page renders", "FAIL", "Application error");
  } else if (isStub) {
    record(3, role, "evidence shows real data or honest zero state", "STUB",
      "Placeholder text found — evidence not connected to ledger");
  } else {
    record(3, role, "evidence shows real data or honest zero state", "PASS");
  }
  await shot("L3-evidence");

  // 3b. Standards page — check that DEFAULT_STANDARDS titles are rendered
  await page.goto(`${BASE_URL}/app/standards`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const stdText = await bodyText(page);
  // DEFAULT_STANDARDS has titles "Mission Clarity" and "Artifact Reflection"
  const hasMissionClarity = stdText.includes("Mission Clarity");
  const hasArtifactReflection = stdText.includes("Artifact Reflection");
  if (hasMissionClarity && hasArtifactReflection) {
    record(3, role, "standards registry renders DEFAULT_STANDARDS", "PASS");
  } else if (hasMissionClarity || hasArtifactReflection) {
    record(3, role, "standards registry renders DEFAULT_STANDARDS", "FAIL",
      "Only partial standards list rendered");
  } else {
    record(3, role, "standards registry renders DEFAULT_STANDARDS", "STUB",
      "Neither 'Mission Clarity' nor 'Artifact Reflection' found — standards not rendered");
  }
  await shot("L3-standards");
}

// ── Layer 4: Hardcoded / demo data detection ──────────────────────────────────

async function runLayer4(page, config, shot) {
  const { role, hardcodedScanRoutes } = config;

  for (const route of hardcodedScanRoutes) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      const text = await bodyText(page);

      let foundHardcoded = false;
      for (const fake of HARDCODED_STRINGS) {
        if (text.includes(fake)) {
          record(4, role, `${route} — no hardcoded data`, "HARDCODED", `Found "${fake}"`);
          foundHardcoded = true;
          break;
        }
      }

      if (!foundHardcoded) {
        let foundStub = false;
        for (const pattern of STUB_PATTERNS) {
          if (pattern.test(text)) {
            record(4, role, `${route} — no stub placeholders`, "STUB", `Matched ${pattern}`);
            foundStub = true;
            break;
          }
        }
        if (!foundStub) {
          record(4, role, `${route} — no hardcoded/stub data`, "PASS");
        }
      }
    } catch (err) {
      record(4, role, `${route} scan`, "FAIL", err.message);
    }
    await shot(`L4${route.replace(/\//g, "-")}`);
  }
}

// ── Layer 5: Cross-role data flow ─────────────────────────────────────────────

async function runLayer5(browser, learnerEmail, teacherEmail) {
  console.log(`\n  ── L5: Cross-role data flow (learner artifact → teacher review queue)`);

  const E2E_ARTIFACT_MARKER = `e2e-cross-role-${Date.now()}`;

  // Step 1: Learner saves artifact
  let ledgerRecordCreated = false;
  let ledgerRecordId = null;

  const learnerCtx = await browser.newContext();
  const learnerPage = await learnerCtx.newPage();
  try {
    const learnerUser = await getUserByEmail(learnerEmail);
    const ticket = await createSignInTicket(learnerUser.id);
    await loginWithTicket(learnerPage, ticket);

    await learnerPage.goto(`${BASE_URL}/app/studio`, { waitUntil: "domcontentloaded" });
    await learnerPage.waitForTimeout(800);

    learnerPage.on("response", async (res) => {
      if (res.url().includes("/api/ledger/records") && res.request().method() === "POST") {
        try {
          const body = await res.json();
          if (body?.id) { ledgerRecordCreated = true; ledgerRecordId = body.id; }
        } catch { /* ignore */ }
      }
    });

    const textarea = learnerPage.locator(`[data-tour="studio-artifact"] textarea`);
    const saveBtn = learnerPage.locator(`[data-tour="artifact-save"]`);

    if (await textarea.count() > 0 && await saveBtn.count() > 0 && !(await saveBtn.isDisabled())) {
      await textarea.fill(`${E2E_ARTIFACT_MARKER}: goal outcome evidence reflect improve next`);
      await saveBtn.click();
      await learnerPage.waitForTimeout(1500);
    }

    if (ledgerRecordCreated) {
      record(5, "cross-role", "learner artifact saved to ledger API", "PASS", `id=${ledgerRecordId}`);
    } else {
      record(5, "cross-role", "learner artifact saved to ledger API", "STUB",
        "Studio save did not POST to /api/ledger/records — data is localStorage only; cannot cross role boundary");
    }
  } catch (err) {
    record(5, "cross-role", "learner saves artifact", "FAIL", err.message);
  } finally {
    await learnerCtx.close();
  }

  // Step 2: Teacher checks review queue for learner's artifact
  const teacherCtx = await browser.newContext();
  const teacherPage = await teacherCtx.newPage();
  try {
    const teacherUser = await getUserByEmail(teacherEmail);
    const ticket = await createSignInTicket(teacherUser.id);
    await loginWithTicket(teacherPage, ticket);

    await teacherPage.goto(`${BASE_URL}/app/reviews`, { waitUntil: "domcontentloaded" });
    await teacherPage.waitForTimeout(800);

    const reviewText = await bodyText(teacherPage);

    // First check for hardcoded demo data — this is the most important signal
    let foundHardcoded = null;
    for (const fake of HARDCODED_STRINGS) {
      if (reviewText.includes(fake)) { foundHardcoded = fake; break; }
    }

    if (foundHardcoded) {
      record(5, "cross-role", "teacher review queue shows learner submission (not fake data)", "HARDCODED",
        `Review queue contains "${foundHardcoded}" — hardcoded demo data, not connected to learner actions`);
    } else if (reviewText.includes(E2E_ARTIFACT_MARKER)) {
      record(5, "cross-role", "teacher review queue shows learner submission", "PASS");
    } else {
      record(5, "cross-role", "teacher review queue shows learner submission", "STUB",
        "Learner artifact does not appear in teacher review queue — data pipe between learner and teacher not implemented");
    }
  } catch (err) {
    record(5, "cross-role", "teacher views review queue", "FAIL", err.message);
  } finally {
    await teacherCtx.close();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!CLERK_SECRET) {
    console.error("CLERK_SECRET_KEY is required. Add it to .env.local.");
    process.exit(1);
  }

  const activeConfigs = ROLE_CONFIGS.filter((c) => process.env[c.emailEnv]);
  const skippedRoles = ROLE_CONFIGS.filter((c) => !process.env[c.emailEnv]).map((c) => c.role);

  if (activeConfigs.length === 0) {
    console.warn("No E2E role credentials set. Populate E2E_*_EMAIL vars in .env.local.");
    console.warn("This test cannot give an honest result without real user sessions.");
    process.exit(1); // Intentional: silence here = false confidence
  }

  if (skippedRoles.length > 0) {
    console.warn(`[SKIP] No credentials for: ${skippedRoles.join(", ")}`);
  }

  mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const config of activeConfigs) {
    const { role, emailEnv, behaviorType } = config;
    const email = process.env[emailEnv];

    console.log(`\n══ ${role} ══`);

    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    let shotIndex = 0;
    async function shot(label) {
      const path = `${ARTIFACT_DIR}/${role}-${String(++shotIndex).padStart(2, "0")}-${label}.png`;
      await page.screenshot({ path, fullPage: true }).catch(() => {});
    }

    try {
      const user = await getUserByEmail(email);
      const ticket = await createSignInTicket(user.id);
      await loginWithTicket(page, ticket);

      console.log(`  ── L1: Route access`);
      await runLayer1(page, config, shot);

      await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      console.log(`  ── L2: Role identity`);
      await runLayer2(page, config, shot);

      console.log(`  ── L3: Behavioral completeness`);
      if (behaviorType === "learner") {
        await runLayer3Learner(page, role, shot);
      } else if (behaviorType === "teacher") {
        await runLayer3Teacher(page, role, shot);
      } else if (behaviorType === "admin") {
        await runLayer3Admin(page, role, shot);
      }

      console.log(`  ── L4: Hardcoded data detection`);
      await runLayer4(page, config, shot);

    } catch (err) {
      record(0, role, "role-test-setup", "FAIL", err.message);
    } finally {
      await ctx.close();
    }
  }

  // Layer 5 requires both learner and teacher credentials
  const learnerCfg = activeConfigs.find((c) => c.role === "student_independent");
  const teacherCfg = activeConfigs.find((c) => c.role === "teacher");

  if (learnerCfg && teacherCfg) {
    console.log(`\n══ cross-role pipe ══`);
    await runLayer5(
      browser,
      process.env[learnerCfg.emailEnv],
      process.env[teacherCfg.emailEnv]
    );
  } else {
    console.log(`\n[SKIP] L5 cross-role pipe — requires E2E_STUDENT_INDEPENDENT_EMAIL + E2E_TEACHER_EMAIL`);
  }

  await browser.close();

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log("\n══════════════════════════════════════════════════════");
  console.log("  ROLE UX FULL TEST — RESULTS");
  console.log("══════════════════════════════════════════════════════");

  const totals = { PASS: 0, FAIL: 0, HARDCODED: 0, STUB: 0, SKIP: 0 };
  for (const r of results) {
    totals[r.status] = (totals[r.status] ?? 0) + 1;
  }

  // Per-role breakdown
  const allRoles = [...new Set(results.map((r) => r.role))];
  for (const role of allRoles) {
    const roleResults = results.filter((r) => r.role === role);
    const c = { PASS: 0, FAIL: 0, HARDCODED: 0, STUB: 0, SKIP: 0 };
    for (const r of roleResults) c[r.status] = (c[r.status] ?? 0) + 1;
    const roleStr = role.padEnd(30);
    console.log(`  ${roleStr} PASS:${c.PASS}  FAIL:${c.FAIL}  HARDCODED:${c.HARDCODED}  STUB:${c.STUB}  SKIP:${c.SKIP}`);
  }

  console.log(`\n  Totals  PASS:${totals.PASS}  FAIL:${totals.FAIL}  HARDCODED:${totals.HARDCODED}  STUB:${totals.STUB}  SKIP:${totals.SKIP}`);

  // Failure detail
  const failures = results.filter((r) => r.status !== "PASS" && r.status !== "SKIP");
  if (failures.length > 0) {
    console.log("\n  Failures:");
    for (const f of failures) {
      console.log(`    [${f.status}] L${f.layer} [${f.role}] ${f.check}${f.detail ? `  →  ${f.detail}` : ""}`);
    }
  }

  // Write JSON report
  const report = { timestamp: TIMESTAMP, baseUrl: BASE_URL, totals, results };
  const reportPath = `${ARTIFACT_DIR}/report.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  Full report:  ${reportPath}`);
  console.log(`  Screenshots:  ${ARTIFACT_DIR}/`);

  const failCount = totals.FAIL + totals.HARDCODED + totals.STUB;
  if (failCount > 0) {
    console.error(
      `\n✗ ${failCount} issue(s) found (FAIL: ${totals.FAIL}, HARDCODED: ${totals.HARDCODED}, STUB: ${totals.STUB}).`
    );
    console.error("  STUB and HARDCODED are real failures — they mean the feature is not implemented.");
    process.exit(1);
  }

  console.log("\n✓ All checks passed.");
}

run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
