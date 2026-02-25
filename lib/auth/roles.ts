export const APP_ROLES = [
  "student_independent",
  "student_enrolled",
  "adult_learner",
  "teacher",
  "professional_development",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];