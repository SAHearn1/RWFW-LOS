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
    { id: "studio", selector: "[data-tour='studio-entry']", title: "Studio Path", body: "Move to Studio to transform your mission draft into an artifact." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Use Help to restart this tour at any time." },
    { id: "core", selector: "[data-tour='core-mount']", title: "Core Mount", body: "Legacy core screens are available during migration.", requiredFlag: "NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT" }
  ],
  student_enrolled: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Navigation", body: "Use the left menu to access assigned learning work." },
    { id: "home", selector: "[data-tour='page-title']", title: "Home", body: "Your enrolled learner workspace starts here." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour from Help if needed." },
    { id: "core", selector: "[data-tour='core-mount']", title: "Core Mount", body: "Legacy core screens are available during migration.", requiredFlag: "NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT" }
  ],
  teacher: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Command Navigation", body: "Teacher tools are grouped in your role navigation." },
    { id: "home", selector: "[data-tour='page-title']", title: "Workspace", body: "This page reflects your current operational area." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour any time from Help." }
  ],
  admin: [
    { id: "nav", selector: "[data-tour='primary-nav']", title: "Admin Navigation", body: "Standards, evidence, and exports are role-scoped." },
    { id: "home", selector: "[data-tour='page-title']", title: "Workspace", body: "This page shows the active admin area." },
    { id: "help", selector: "[data-tour='help-menu']", title: "Help Menu", body: "Restart tour from Help when needed." }
  ]
} as const;
