import { existsSync, readFileSync } from "node:fs";

const routeAccessPath = "lib/auth/routeAccess.ts";
const requiredPaths = ["/app", "/app/studio", "/app/credentials", "/app/evidence"];

if (!existsSync(routeAccessPath)) {
  console.error(`Missing ${routeAccessPath}`);
  process.exit(1);
}

const content = readFileSync(routeAccessPath, "utf8");
const missing = requiredPaths.filter((path) => !content.includes(`path: \"${path}\"`));

if (missing.length > 0) {
  console.error(`Missing required route definitions: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Route smoke check passed:", requiredPaths.join(", "));
