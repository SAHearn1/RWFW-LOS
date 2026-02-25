import type { AppRole } from "@/lib/auth/roles";

export type AppNotification = {
  id: string;
  level: "info" | "warning";
  message: string;
};

const ROLE_NOTIFICATIONS: Readonly<Record<AppRole, readonly AppNotification[]>> = {
  student_independent: [
    { id: "student-welcome", level: "info", message: "Start your next mission from Home (PLE)." },
    { id: "student-credential", level: "info", message: "Check Credentials for recent verification updates." }
  ],
  student_enrolled: [
    { id: "enrolled-missions", level: "info", message: "Continue assigned missions in your queue." },
    { id: "enrolled-studio", level: "info", message: "Save artifacts in Studio to update your timeline." }
  ],
  adult_learner: [
    { id: "adult-progress", level: "info", message: "Review your progress timeline in Credentials." },
    { id: "adult-focus", level: "warning", message: "Prioritize missions marked in progress this week." }
  ],
  teacher: [
    { id: "teacher-queue", level: "warning", message: "Review the intervention queue for urgent learners." },
    { id: "teacher-reviews", level: "info", message: "Complete pending reviews before export checkpoints." }
  ],
  professional_development: [
    { id: "pd-reviews", level: "warning", message: "Facilitator reviews have pending interventions." },
    { id: "pd-cohorts", level: "info", message: "Monitor cohort readiness in command surfaces." }
  ],
  admin: [
    { id: "admin-health", level: "info", message: "Pilot health cards are available in Exports." },
    { id: "admin-release", level: "warning", message: "Confirm release gate and synthetic smoke before promotion." }
  ]
} as const;

export function getNotificationsForRole(role: AppRole): readonly AppNotification[] {
  return ROLE_NOTIFICATIONS[role];
}
