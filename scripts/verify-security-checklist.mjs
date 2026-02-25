import { readFileSync } from "node:fs";

const threatModel = readFileSync("docs/security/threat-model.md", "utf8");
const requiredHeadings = ["Spoofing", "Tampering", "Repudiation", "Information Disclosure", "Denial of Service", "Elevation of Privilege"];

const missing = requiredHeadings.filter((heading) => !threatModel.includes(heading));
if (missing.length > 0) {
  console.error(`Threat model verifier failed. Missing sections: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Security threat-model verifier passed.");
