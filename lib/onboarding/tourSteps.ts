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
    { id: "home", selector: "[data-tour='page-title']", title: "Workspace", body: "This page reflects your current operational area." },
    { id: "command-center", selector: "[data-tour='command-center-dashboard']", title: "Your Command Center", body: "Get a live overview of active cohorts, the review backlog, and your pickup queue." },
    { id: "cohorts", selector: "[data-tour='cohorts-list']", title: "Manage Cohorts", body: "View and organize your learner cohorts. Track enrollment and activity at a glance." },
    { id: "review-queue", selector: "[data-tour='review-queue']", title: "Review Artifacts", body: "Work through the artifact review queue — approve, return, or flag learner submissions." },
    { id: "builder", selector: "[data-tour='builder-workspace']", title: "Build Missions", body: "Create mission templates and configure new cohorts for your learners." },
    { id: "pickups", selector: "[data-tour='pickups-panel']", title: "Pickup Assignments", body: "Assign pickup sessions to learners who need additional support." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour any time from Help." }
  ],
  professional_development: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Your Facilitator Navigation", body: "Use the sidebar to access your Command Center, Cohorts, Reviews, Builder, and Pickups." },
    { id: "home", selector: "[data-tour='page-title']", title: "Professional Development Home", body: "Your PD dashboard gives you a quick view of active sessions, pending reviews, and cohort health." },
    { id: "command-center", selector: "[data-tour='command-center-dashboard']", title: "Command Center", body: "Your operational hub: active cohorts, pickup queue, and review backlog at a glance." },
    { id: "cohorts", selector: "[data-tour='cohorts-list']", title: "Cohorts", body: "Manage your cohorts, view member counts, and track learner progress." },
    { id: "reviews", selector: "[data-tour='review-queue']", title: "Review Queue", body: "Approve, return, or flag learner artifacts. Your review decisions shape credential eligibility." },
    { id: "builder", selector: "[data-tour='builder-workspace']", title: "Mission Builder", body: "Create and configure missions and cohorts for your learners." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help & Tour Restart", body: "Click here at any time to restart this tour or get support." }
  ],
  admin: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Admin Navigation", body: "Standards, evidence, and exports are role-scoped." },
    { id: "home", selector: "[data-tour='page-title']", title: "Workspace", body: "This page shows the active admin area." },
    { id: "standards-registry", selector: "[data-tour='standards-registry']", title: "Standards Registry", body: "View and test the standards your organization uses to verify learner artifacts." },
    { id: "evidence", selector: "[data-tour='page-title']", title: "Evidence View", body: "Browse all learner evidence records across missions and artifacts." },
    { id: "exports", selector: "[data-tour='page-title']", title: "Export Readiness", body: "Review export readiness and download data packages for compliance reporting." },
    { id: "institutions", selector: "[data-tour='institutions-panel']", title: "Institution Management", body: "Manage institutions, licenses, teachers, and users from the super-admin panel." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour from Help when needed." }
  ]
} as const;