import { readFileSync } from "node:fs";

const routeAccess = readFileSync("lib/auth/routeAccess.ts", "utf8");
const navItems = readFileSync("lib/nav/items.ts", "utf8");

const requiredRoutes = [
  "/app",
  "/app/studio",
  "/app/missions",
  "/app/credentials",
  "/app/settings",
  "/app/command-center",
  "/app/evidence",
  "/app/exports",
  "/app/profile",
  "/app/core"
];

const roleToExpectedNav = {
  student_independent: ["/app/studio", "/app/credentials", "/app/settings"],
  student_enrolled: ["/app/studio", "/app/credentials", "/app/settings"],
  teacher: ["/app/command-center", "/app/cohorts", "/app/reviews"],
  admin: ["/app/evidence", "/app/exports", "/app/standards"]
};

const missingRoutes = requiredRoutes.filter((route) => !routeAccess.includes(`path: "${route}"`));
if (missingRoutes.length > 0) {
  console.error(`Missing route contracts: ${missingRoutes.join(", ")}`);
  process.exit(1);
}

for (const [role, routes] of Object.entries(roleToExpectedNav)) {
  const missing = routes.filter((route) => !navItems.includes(`href: "${route}"`));
  if (missing.length > 0) {
    console.error(`Role ${role} is missing expected nav routes: ${missing.join(", ")}`);
    process.exit(1);
  }
}

console.log("Role-route verifier passed.");

