import type { AppRole } from "./roles";

export type AppRouteDefinition = {
  path: `/app${string}`;
  title: string;
  description: string;
  allowedRoles: readonly AppRole[];
};

const ALL_ROLES: readonly AppRole[] = [
  "student_independent",
  "student_enrolled",
  "adult_learner",
  "teacher",
  "professional_development",
  "admin"
] as const;

const LEARNER_ROLES: readonly AppRole[] = [
  "student_independent",
  "student_enrolled",
  "adult_learner"
] as const;

const FACILITATOR_ROLES: readonly AppRole[] = [
  "teacher",
  "professional_development"
] as const;

const ADMIN_ROLE: readonly AppRole[] = ["admin"] as const;

export const LEGACY_APP_ROUTE_REDIRECTS: Readonly<Record<string, `/app${string}`>> = {
  "/app/home": "/app",
  "/app/ple": "/app",
  "/app/create": "/app/studio"
} as const;

export const APP_ROUTE_DEFINITIONS: readonly AppRouteDefinition[] = [
  { path: "/app", title: "Home", description: "RootWork shell home.", allowedRoles: ALL_ROLES },
  { path: "/app/profile", title: "Profile", description: "User role and organization summary.", allowedRoles: ALL_ROLES },
  { path: "/app/core", title: "Core Mount", description: "Temporary bridge into legacy core screens.", allowedRoles: ALL_ROLES },
  { path: "/app/missions", title: "Missions", description: "Mission launch placeholder.", allowedRoles: LEARNER_ROLES },
  { path: "/app/studio", title: "Studio", description: "Artifact creation workspace placeholder.", allowedRoles: LEARNER_ROLES },
  { path: "/app/portfolio", title: "Portfolio", description: "Evidence portfolio placeholder.", allowedRoles: LEARNER_ROLES },
  { path: "/app/credentials", title: "Credentials", description: "Credential summary view.", allowedRoles: LEARNER_ROLES },
  { path: "/app/settings", title: "Settings", description: "Learner settings placeholder.", allowedRoles: LEARNER_ROLES },
  { path: "/app/command-center", title: "Command Center", description: "Facilitator operations placeholder.", allowedRoles: FACILITATOR_ROLES },
  { path: "/app/cohorts", title: "Cohorts", description: "Facilitator cohort management placeholder.", allowedRoles: FACILITATOR_ROLES },
  { path: "/app/pickups", title: "Pickups", description: "Facilitator pickups placeholder.", allowedRoles: FACILITATOR_ROLES },
  { path: "/app/reviews", title: "Reviews", description: "Facilitator review queue placeholder.", allowedRoles: FACILITATOR_ROLES },
  { path: "/app/builder", title: "Builder", description: "Facilitator builder placeholder.", allowedRoles: FACILITATOR_ROLES },
  { path: "/app/standards", title: "Standards", description: "Admin standards placeholder.", allowedRoles: ADMIN_ROLE },
  { path: "/app/evidence", title: "Evidence", description: "Admin evidence read view.", allowedRoles: ADMIN_ROLE },
  { path: "/app/exports", title: "Exports", description: "Admin export tools placeholder.", allowedRoles: ADMIN_ROLE },
  { path: "/app/forbidden", title: "Access Restricted", description: "In-app 403 view.", allowedRoles: ALL_ROLES }
] as const;

export function normalizeAppPath(pathname: string): `/app${string}` | null {
  const normalized = LEGACY_APP_ROUTE_REDIRECTS[pathname] ?? pathname;
  if (!normalized.startsWith("/app")) {
    return null;
  }

  return normalized as `/app${string}`;
}

export function getRouteDefinition(pathname: string): AppRouteDefinition | null {
  const normalized = normalizeAppPath(pathname);
  if (!normalized) {
    return null;
  }

  return APP_ROUTE_DEFINITIONS.find((definition) => definition.path === normalized) ?? null;
}

export function isKnownAppPath(pathname: string): boolean {
  return getRouteDefinition(pathname) !== null;
}

export function isRoleAllowedForPath(pathname: string, role: AppRole): boolean {
  const definition = getRouteDefinition(pathname);
  if (!definition) {
    return false;
  }

  return definition.allowedRoles.includes(role);
}