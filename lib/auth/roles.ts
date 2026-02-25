export const APP_ROLES = [
  "student_independent",
  "student_enrolled",
  "teacher",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];
