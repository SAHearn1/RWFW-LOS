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
  adult_learner: ["/app/studio", "/app/credentials", "/app/settings"],
  teacher: ["/app/command-center", "/app/cohorts", "/app/reviews"],
  professional_development: ["/app/command-center", "/app/cohorts", "/app/reviews"],
  admin: ["/app/evidence", "/app/exports", "/app/standards"]
};

const roleToForbiddenNav = {
  student_independent: ["/app/evidence", "/app/exports", "/app/command-center"],
  student_enrolled: ["/app/evidence", "/app/exports", "/app/command-center"],
  adult_learner: ["/app/evidence", "/app/exports", "/app/command-center"],
  teacher: ["/app/evidence", "/app/exports", "/app/standards", "/app/missions"],
  professional_development: ["/app/evidence", "/app/exports", "/app/standards", "/app/missions"],
  admin: ["/app/command-center", "/app/reviews", "/app/missions"]
};

// Use regex so that optional whitespace variations (path:"..." vs path: "...")
// and comment occurrences outside object literals don't cause false results.
function routeInSource(source, route) {
  const escaped = route.replace(/[/]/g, "\\/");
  return new RegExp(`path:\\s*"${escaped}"`).test(source);
}

function hrefInSource(source, route) {
  const escaped = route.replace(/[/]/g, "\\/");
  return new RegExp(`href:\\s*"${escaped}"`).test(source);
}

const missingRoutes = requiredRoutes.filter((route) => !routeInSource(routeAccess, route));
if (missingRoutes.length > 0) {
  console.error(`Missing route contracts: ${missingRoutes.join(", ")}`);
  process.exit(1);
}

for (const [role, routes] of Object.entries(roleToExpectedNav)) {
  const missing = routes.filter((route) => !hrefInSource(navItems, route));
  if (missing.length > 0) {
    console.error(`Role ${role} is missing expected nav routes: ${missing.join(", ")}`);
    process.exit(1);
  }
}

for (const [role, routes] of Object.entries(roleToForbiddenNav)) {
  const roleBlockStart = `${role}: [`;
  const start = navItems.indexOf(roleBlockStart);
  if (start < 0) {
    console.error(`Unable to locate nav block for role ${role}`);
    process.exit(1);
  }

  const end = navItems.indexOf("]", start);
  const block = navItems.slice(start, end);

  const leaked = routes.filter((route) => hrefInSource(block, route));
  if (leaked.length > 0) {
    console.error(`Role ${role} contains forbidden routes: ${leaked.join(", ")}`);
    process.exit(1);
  }
}

console.log("Role-route verifier passed.");
