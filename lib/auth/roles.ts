export const APP_ROLES = [
  "student_independent",
  "student_enrolled",
  "adult_learner",
  "teacher",
  "professional_development",
  "admin",
  "super_admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/**
 * Roles that require a Clerk orgId before accessing /app/*.
 * Enforced in app/app/layout.tsx and app/api/super-admin/assign-role/route.ts.
 * `student_independent` and `adult_learner` intentionally excluded (no org required).
 */
export const ORG_REQUIRED_ROLES = new Set<AppRole>([
  "student_enrolled",
  "teacher",
  "professional_development",
  "admin",
  "super_admin",
]);