import { readFileSync } from "node:fs";

const tourText = readFileSync("lib/onboarding/tourSteps.ts", "utf8");
const appText = [
  readFileSync("components/app-shell/AppShell.tsx", "utf8"),
  readFileSync("components/ple/PLEHome.tsx", "utf8"),
  readFileSync("components/studio/StudioWorkspace.tsx", "utf8"),
  readFileSync("components/core-mount/CoreMountRuntime.tsx", "utf8"),
  readFileSync("components/credentials/CredentialsSummary.tsx", "utf8"),
  readFileSync("components/evidence/AdminEvidenceView.tsx", "utf8"),
  readFileSync("app/app/[[...slug]]/page.tsx", "utf8")
].join("\n");

const selectorRegex = /selector:\s*"\[data-tour='([^']+)'\]"/g;
const selectors = [];
let match;
while ((match = selectorRegex.exec(tourText)) !== null) {
  selectors.push(match[1]);
}

const missingSelectors = selectors.filter((selector) => !appText.includes(`data-tour=\"${selector}\"`) && !appText.includes(`data-tour='${selector}'`));
if (missingSelectors.length > 0) {
  console.error(`Onboarding selectors missing in UI: ${missingSelectors.join(", ")}`);
  process.exit(1);
}

console.log("Onboarding resilience verifier passed.");
