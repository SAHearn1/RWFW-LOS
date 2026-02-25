import { readFileSync } from "node:fs";

const prTemplate = readFileSync(".github/pull_request_template.md", "utf8");

const requiredLines = [
  "No parallel PR overlap on the same layout file",
  "<= 15 files changed",
  "Feature flags respected / disabled features safe"
];

const missing = requiredLines.filter((line) => !prTemplate.includes(line));
if (missing.length > 0) {
  console.error(`PR template policy check failed. Missing lines: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Branch policy checklist verifier passed.");
