import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
const targets = files.length > 0 ? files : ["app/app/layout.tsx", "app/layout.tsx"];

const duplicateTargets = targets.filter((file, index) => targets.indexOf(file) !== index);
if (duplicateTargets.length > 0) {
  console.error(`Swarm overlap detected in provided file list: ${[...new Set(duplicateTargets)].join(", ")}`);
  process.exit(1);
}

for (const file of targets) {
  try {
    readFileSync(file, "utf8");
  } catch {
    // Allow non-existing files if they are supplied from CI diff context.
  }
}

console.log("Swarm overlap verifier passed.");
