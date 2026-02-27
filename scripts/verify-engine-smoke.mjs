import { existsSync, readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFile(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

let failed = false;
const warnings = [];

function pass(msg) {
  console.log(`  \u2713 ${msg}`);
}

function fail(msg) {
  console.error(`  \u2717 FAIL: ${msg}`);
  failed = true;
}

function warn(msg) {
  warnings.push(msg);
}

// ---------------------------------------------------------------------------
// Check 1 — Contract files present
// ---------------------------------------------------------------------------

const requiredFiles = [
  "lib/orchestration/contracts.ts",
  "lib/orchestration/stateMachine.ts",
  "lib/orchestration/queueAdapter.ts",
  "lib/llm/providerContracts.ts",
  "lib/llm/routerContracts.ts",
  "lib/federation/protocol.ts",
  "lib/federation/registryContracts.ts",
];

const presentFiles = requiredFiles.filter((f) => existsSync(f));
const missingFiles = requiredFiles.filter((f) => !existsSync(f));

console.log("Engine smoke checks:");

if (missingFiles.length > 0) {
  fail(
    `Contract files present (${presentFiles.length}/${requiredFiles.length}) — missing: ${missingFiles.join(", ")}`
  );
} else {
  pass(`Contract files present (${requiredFiles.length}/${requiredFiles.length})`);
}

// ---------------------------------------------------------------------------
// Check 2 — Route contracts defined
// ---------------------------------------------------------------------------

const routeContractContent = readFile("lib/auth/routeAccess.ts");
const requiredRoutes = ["/app", "/app/core", "/app/studio"];

if (routeContractContent === null) {
  fail("Route contracts defined — lib/auth/routeAccess.ts not found");
} else {
  const presentRoutes = requiredRoutes.filter((r) => routeContractContent.includes(`path: "${r}"`));
  const missingRoutes = requiredRoutes.filter((r) => !routeContractContent.includes(`path: "${r}"`));

  if (missingRoutes.length > 0) {
    fail(
      `Route contracts defined (${presentRoutes.length}/${requiredRoutes.length}) — missing: ${missingRoutes.join(", ")}`
    );
  } else {
    pass(`Route contracts defined (${requiredRoutes.length}/${requiredRoutes.length})`);
  }
}

// ---------------------------------------------------------------------------
// Check 3 — LLM provider registered
// ---------------------------------------------------------------------------
// ModelRouter is defined in lib/llm/router.ts; it receives providers via
// constructor injection. The canonical wiring point is app/api/inference/route.ts
// which instantiates LocalOllamaProvider and CloudManagedProvider and passes
// them to ModelRouter. We search there (and fall back to the router itself).

const providerSearchPaths = [
  "app/api/inference/route.ts",
  "app/api/ai/health/route.ts",
  "lib/llm/router.ts",
  "lib/llm/modelRouter.ts",
];

let providerFound = null;

for (const p of providerSearchPaths) {
  const content = readFile(p);
  if (content === null) continue;
  if (content.includes("new LocalOllamaProvider")) {
    providerFound = "LocalOllamaProvider";
    break;
  }
  if (content.includes("new CloudManagedProvider")) {
    providerFound = "CloudManagedProvider";
    break;
  }
}

if (providerFound) {
  pass(`LLM provider registered: ${providerFound}`);
} else {
  fail(
    "LLM provider registered — neither new LocalOllamaProvider nor new CloudManagedProvider found in provider search paths"
  );
}

// ---------------------------------------------------------------------------
// Check 4 — Queue adapter instantiated
// ---------------------------------------------------------------------------

const workerRouteContent = readFile("app/api/orchestration/worker-run/route.ts");

if (workerRouteContent === null) {
  fail("Queue adapter instantiated — app/api/orchestration/worker-run/route.ts not found");
} else {
  let adapterFound = null;
  if (workerRouteContent.includes("new SqsQueueAdapter")) {
    adapterFound = "SqsQueueAdapter";
  } else if (workerRouteContent.includes("new InMemoryQueueAdapter")) {
    adapterFound = "InMemoryQueueAdapter";
  }

  if (adapterFound) {
    pass(`Queue adapter instantiated: ${adapterFound}`);
  } else {
    fail(
      "Queue adapter instantiated — neither new SqsQueueAdapter nor new InMemoryQueueAdapter found in worker-run/route.ts"
    );
  }
}

// ---------------------------------------------------------------------------
// Check 5 — State store imported
// ---------------------------------------------------------------------------

if (workerRouteContent === null) {
  fail("State store imported — app/api/orchestration/worker-run/route.ts not found");
} else {
  if (workerRouteContent.includes("DynamoOrchestrationStateStore")) {
    pass("State store imported");
  } else {
    fail(
      "State store imported — DynamoOrchestrationStateStore not found in app/api/orchestration/worker-run/route.ts"
    );
  }
}

// ---------------------------------------------------------------------------
// Check 6 — Federation API route present and imports from lib/federation/
// ---------------------------------------------------------------------------

const federationRoutePath = "app/api/federation/route.ts";
const federationRouteContent = readFile(federationRoutePath);

if (federationRouteContent === null) {
  fail(`Federation API route present — ${federationRoutePath} does not exist`);
} else {
  if (federationRouteContent.includes("from") && federationRouteContent.includes("lib/federation/")) {
    pass("Federation API route present");
  } else {
    fail(
      `Federation API route present — ${federationRoutePath} exists but does not import from lib/federation/`
    );
  }
}

// ---------------------------------------------------------------------------
// Check 7 — CloudManagedProvider stub detection (WARNING only)
// ---------------------------------------------------------------------------

const cloudManagedContent = readFile("lib/llm/providers/cloudManaged.ts");

if (cloudManagedContent !== null && cloudManagedContent.includes("Cloud inference request accepted")) {
  warn("CloudManagedProvider may be fire-and-forget stub (see INF-01)");
}

// ---------------------------------------------------------------------------
// Print warnings
// ---------------------------------------------------------------------------

for (const w of warnings) {
  console.log(`  \u26a0 WARNING: ${w}`);
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------

if (failed) {
  process.exit(1);
}
