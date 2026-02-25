import type { AppRole } from "@/lib/auth/roles";
import type { Phase1FeatureFlagKey } from "@/lib/config/featureFlags";

export type TourStep = {
  id: string;
  selector: string;
  title: string;
  body: string;
  requiredFlag?: Phase1FeatureFlagKey;
};

export const ROLE_TOUR_STEPS: Readonly<Record<AppRole, readonly TourStep[]>> = {
  student_independent: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Navigation", body: "Use left navigation to move through PLE, missions, and studio." },
    { id: "home", selector: "[data-tour='page-title']", title: "Home", body: "This is your current workspace context." },
    { id: "mission", selector: "[data-tour='mission-draft']", title: "Mission Draft", body: "Capture your mission objective before moving into Studio." },
    { id: "mission-actions", selector: "[data-tour='mission-actions']", title: "Mission Actions", body: "Start or submit mission lifecycle events from PLE." },
    { id: "studio", selector: "[data-tour='studio-entry']", title: "Studio Path", body: "Move to Studio to transform your mission draft into an artifact." },
    { id: "artifact-save", selector: "[data-tour='artifact-save']", title: "Artifact Save", body: "Save artifact content to the local evidence ledger." },
    { id: "verification", selector: "[data-tour='verification-summary']", title: "Verification", body: "Review standards verification summary after saving." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Use Help to restart this tour at any time." },
    { id: "core", selector: "[data-tour='core-mount']", title: "Core Mount", body: "Legacy core screens are available during migration.", requiredFlag: "NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT" }
  ],
  student_enrolled: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Navigation", body: "Use the left menu to access assigned learning work." },
    { id: "home", selector: "[data-tour='page-title']", title: "Home", body: "Your enrolled learner workspace starts here." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour from Help if needed." },
    { id: "core", selector: "[data-tour='core-mount']", title: "Core Mount", body: "Legacy core screens are available during migration.", requiredFlag: "NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT" }
  ],
  adult_learner: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Navigation", body: "Use your adult learner navigation to move from goals to evidence." },
    { id: "home", selector: "[data-tour='page-title']", title: "Adult Workspace", body: "Track applied objectives and professional artifacts from this home view." },
    { id: "mission", selector: "[data-tour='mission-draft']", title: "Current Goal", body: "Capture your current objective and launch a mission cycle." },
    { id: "studio", selector: "[data-tour='studio-entry']", title: "Studio", body: "Move into Studio to finalize your adult learning artifact." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart this tour at any time from Help." }
  ],
  teacher: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Command Navigation", body: "Teacher tools are grouped in your role navigation." },
    { id: "home", selector: "[data-tour='page-title']", title: "Teacher Home", body: "This home view summarizes intervention, cohort, and review signals." },
    { id: "context", selector: "[data-tour='page-description']", title: "Operational Context", body: "Use this context to decide where to intervene first." },
    { id: "notifications", selector: "[data-tour='notification-menu']", title: "Notifications", body: "Watch operational alerts for blockers and escalations." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour any time from Help." }
  ],
  professional_development: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "PD Navigation", body: "Professional development tools are grouped for facilitation work." },
    { id: "home", selector: "[data-tour='page-title']", title: "PD Workspace", body: "Coordinate cohorts, reviews, and session flow from this home view." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour any time from Help." }
  ],
  admin: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Admin Navigation", body: "Standards, evidence, and exports are role-scoped." },
    { id: "home", selector: "[data-tour='page-title']", title: "Admin Home", body: "This home view summarizes standards health and release readiness." },
    { id: "context", selector: "[data-tour='page-description']", title: "Governance Context", body: "Use this context to prioritize standards, evidence, and exports." },
    { id: "notifications", selector: "[data-tour='notification-menu']", title: "Notifications", body: "Use notifications to track governance alerts and export blockers." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour from Help when needed." }
  ],
  super_admin: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Super Admin Navigation", body: "User Roster, Teacher Assignment, Licenses, and Institutions are your primary controls." },
    { id: "home", selector: "[data-tour='page-title']", title: "Super Admin Dashboard", body: "This overview surfaces platform health, active licenses, and pending teacher requests." },
    { id: "users", selector: "[data-tour='user-roster-entry']", title: "User Roster", body: "View and manage all platform accounts from User Roster." },
    { id: "teachers", selector: "[data-tour='teacher-assignment-entry']", title: "Teacher Assignment", body: "Only Super Admins can grant the Teacher role. Use Teacher Assignment to authorize educators." },
    { id: "licenses", selector: "[data-tour='license-manager-entry']", title: "Licenses", body: "Create trial accounts, issue institutional licenses, and configure enterprise seats from here." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart this tour any time from Help." }
  ]
} as const;
