import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "lib/orchestration/contracts.ts",
  "lib/orchestration/stateMachine.ts",
  "lib/orchestration/queueAdapter.ts",
  "lib/llm/providerContracts.ts",
  "lib/llm/routerContracts.ts",
  "lib/federation/protocol.ts",
  "lib/federation/registryContracts.ts"
];

const missingFiles = requiredFiles.filter((file) => !existsSync(file));
if (missingFiles.length > 0) {
  console.error(`Engine smoke failed. Missing files: ${missingFiles.join(", ")}`);
  process.exit(1);
}

const routeContract = readFileSync("lib/auth/routeAccess.ts", "utf8");
const requiredRoutes = ["/app", "/app/core", "/app/studio"];
const missingRoutes = requiredRoutes.filter((route) => !routeContract.includes(`path: "${route}"`));
if (missingRoutes.length > 0) {
  console.error(`Engine smoke failed. Missing route contracts: ${missingRoutes.join(", ")}`);
  process.exit(1);
}

console.log("Engine smoke verifier passed.");
