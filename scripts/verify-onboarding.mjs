import { readFileSync } from "node:fs";

const tourText = readFileSync("lib/onboarding/tourSteps.ts", "utf8");
const appText = [
  readFileSync("components/app-shell/AppShell.tsx", "utf8"),
  readFileSync("components/ple/PLEHome.tsx", "utf8"),
  readFileSync("components/studio/StudioWorkspace.tsx", "utf8"),
  readFileSync("components/core-mount/CoreMountRuntime.tsx", "utf8"),
  readFileSync("components/credentials/CredentialsSummary.tsx", "utf8"),
  readFileSync("components/evidence/AdminEvidenceView.tsx", "utf8"),
  readFileSync("components/dashboards/SuperAdminHome.tsx", "utf8"),
  readFileSync("app/app/[[...slug]]/page.tsx", "utf8")
].join("\n");

// --- Selector presence check ---
const selectorRegex = /selector:\s*"\[data-tour='([^']+)'\]"/g;
const selectors = [];
let match;
while ((match = selectorRegex.exec(tourText)) !== null) {
  selectors.push(match[1]);
}

const missingSelectors = selectors.filter((selector) => !appText.includes(`data-tour="${selector}"`) && !appText.includes(`data-tour='${selector}'`));
if (missingSelectors.length > 0) {
  console.error(`Onboarding selectors missing in UI: ${missingSelectors.join(", ")}`);
  process.exit(1);
}

// --- Per-role step count assertions ---
// These counts are the contract. Update here (and in tourSteps.ts) when adding/removing steps.
const EXPECTED_STEP_COUNTS = {
  student_independent: 9,
  student_enrolled: 4,
  adult_learner: 5,
  teacher: 5,
  professional_development: 5,
  admin: 5,
  super_admin: 6,
};

const roleNames = Object.keys(EXPECTED_STEP_COUNTS);
const countErrors = [];

for (let i = 0; i < roleNames.length; i++) {
  const role = roleNames[i];
  const nextRole = roleNames[i + 1];

  const startIdx = tourText.indexOf(`${role}: [`);
  if (startIdx === -1) {
    countErrors.push(`Role "${role}" block not found in tourSteps.ts`);
    continue;
  }

  const endIdx = nextRole ? tourText.indexOf(`${nextRole}: [`, startIdx) : tourText.length;
  const block = tourText.slice(startIdx, endIdx);
  const stepCount = (block.match(/\{ id:/g) ?? []).length;

  if (stepCount !== EXPECTED_STEP_COUNTS[role]) {
    countErrors.push(`Role "${role}": expected ${EXPECTED_STEP_COUNTS[role]} steps, found ${stepCount}`);
  }
}

if (countErrors.length > 0) {
  console.error(`Onboarding step count mismatches:\n  ${countErrors.join("\n  ")}`);
  process.exit(1);
}

console.log("Onboarding resilience verifier passed.");
