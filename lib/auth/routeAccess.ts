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
  "teacher",
  "admin"
] as const;

const STUDENT_ROLES: readonly AppRole[] = ["student_independent", "student_enrolled"] as const;
const TEACHER_ROLE: readonly AppRole[] = ["teacher"] as const;
const ADMIN_ROLE: readonly AppRole[] = ["admin"] as const;

export const APP_ROUTE_DEFINITIONS: readonly AppRouteDefinition[] = [
  { path: "/app", title: "Home", description: "RootWork shell home.", allowedRoles: ALL_ROLES },
  { path: "/app/profile", title: "Profile", description: "User role and organization summary.", allowedRoles: ALL_ROLES },
  { path: "/app/core", title: "Core Mount", description: "Temporary bridge into legacy core screens.", allowedRoles: ALL_ROLES },
  { path: "/app/missions", title: "Missions", description: "Mission launch placeholder.", allowedRoles: STUDENT_ROLES },
  { path: "/app/studio", title: "Studio", description: "Artifact creation workspace placeholder.", allowedRoles: STUDENT_ROLES },
  { path: "/app/portfolio", title: "Portfolio", description: "Evidence portfolio placeholder.", allowedRoles: STUDENT_ROLES },
  { path: "/app/credentials", title: "Credentials", description: "Credential summary placeholder.", allowedRoles: STUDENT_ROLES },
  { path: "/app/settings", title: "Settings", description: "Student settings placeholder.", allowedRoles: STUDENT_ROLES },
  { path: "/app/command-center", title: "Command Center", description: "Teacher operations placeholder.", allowedRoles: TEACHER_ROLE },
  { path: "/app/cohorts", title: "Cohorts", description: "Teacher cohort management placeholder.", allowedRoles: TEACHER_ROLE },
  { path: "/app/pickups", title: "Pickups", description: "Teacher pickups placeholder.", allowedRoles: TEACHER_ROLE },
  { path: "/app/reviews", title: "Reviews", description: "Teacher review queue placeholder.", allowedRoles: TEACHER_ROLE },
  { path: "/app/builder", title: "Builder", description: "Teacher builder placeholder.", allowedRoles: TEACHER_ROLE },
  { path: "/app/standards", title: "Standards", description: "Admin standards placeholder.", allowedRoles: ADMIN_ROLE },
  { path: "/app/evidence", title: "Evidence", description: "Admin evidence controls placeholder.", allowedRoles: ADMIN_ROLE },
  { path: "/app/exports", title: "Exports", description: "Admin export tools placeholder.", allowedRoles: ADMIN_ROLE },
  { path: "/app/forbidden", title: "Access Restricted", description: "In-app 403 view.", allowedRoles: ALL_ROLES }
] as const;

export function getRouteDefinition(pathname: string): AppRouteDefinition | null {
  return APP_ROUTE_DEFINITIONS.find((definition) => definition.path === pathname) ?? null;
}

export function isKnownAppPath(pathname: string): boolean {
  return APP_ROUTE_DEFINITIONS.some((definition) => definition.path === pathname);
}

export function isRoleAllowedForPath(pathname: string, role: AppRole): boolean {
  const definition = getRouteDefinition(pathname);
  if (!definition) {
    return false;
  }

  return definition.allowedRoles.includes(role);
}
