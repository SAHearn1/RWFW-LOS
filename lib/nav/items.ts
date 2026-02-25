import type { AppRole } from "@/lib/auth/roles";

export type NavItem = {
  href: string;
  label: string;
};

export const NAV_ITEMS_BY_ROLE: Readonly<Record<AppRole, readonly NavItem[]>> = {
  student_independent: [
    { href: "/app", label: "Home (PLE)" },
    { href: "/app/missions", label: "Missions" },
    { href: "/app/studio", label: "Studio" },
    { href: "/app/portfolio", label: "Portfolio" },
    { href: "/app/credentials", label: "Credentials" },
    { href: "/app/settings", label: "Settings" },
    { href: "/app/core", label: "Core" },
    { href: "/app/profile", label: "Profile" }
  ],
  student_enrolled: [
    { href: "/app", label: "Home (PLE)" },
    { href: "/app/missions", label: "Missions" },
    { href: "/app/studio", label: "Studio" },
    { href: "/app/portfolio", label: "Portfolio" },
    { href: "/app/credentials", label: "Credentials" },
    { href: "/app/settings", label: "Settings" },
    { href: "/app/core", label: "Core" },
    { href: "/app/profile", label: "Profile" }
  ],
  adult_learner: [
    { href: "/app", label: "Home (Adult)" },
    { href: "/app/missions", label: "Missions" },
    { href: "/app/studio", label: "Studio" },
    { href: "/app/portfolio", label: "Portfolio" },
    { href: "/app/credentials", label: "Credentials" },
    { href: "/app/settings", label: "Settings" },
    { href: "/app/core", label: "Core" },
    { href: "/app/profile", label: "Profile" }
  ],
  teacher: [
    { href: "/app", label: "Home" },
    { href: "/app/command-center", label: "Command Center" },
    { href: "/app/cohorts", label: "Cohorts" },
    { href: "/app/pickups", label: "Pickups" },
    { href: "/app/reviews", label: "Reviews" },
    { href: "/app/builder", label: "Builder" },
    { href: "/app/core", label: "Core" },
    { href: "/app/profile", label: "Profile" }
  ],
  professional_development: [
    { href: "/app", label: "Home (PD)" },
    { href: "/app/command-center", label: "Command Center" },
    { href: "/app/cohorts", label: "Cohorts" },
    { href: "/app/pickups", label: "Pickups" },
    { href: "/app/reviews", label: "Reviews" },
    { href: "/app/builder", label: "Builder" },
    { href: "/app/core", label: "Core" },
    { href: "/app/profile", label: "Profile" }
  ],
  admin: [
    { href: "/app", label: "Home" },
    { href: "/app/standards", label: "Standards" },
    { href: "/app/evidence", label: "Evidence" },
    { href: "/app/exports", label: "Exports" },
    { href: "/app/core", label: "Core" },
    { href: "/app/profile", label: "Profile" }
  ],
  super_admin: [
    { href: "/app", label: "Dashboard" },
    { href: "/app/super-admin/users", label: "User Roster" },
    { href: "/app/super-admin/teachers", label: "Teacher Assignment" },
    { href: "/app/super-admin/licenses", label: "Licenses" },
    { href: "/app/super-admin/institutions", label: "Institutions" },
    { href: "/app/profile", label: "Profile" }
  ]
} as const;

export function getNavItemsForRole(role: AppRole): readonly NavItem[] {
  return NAV_ITEMS_BY_ROLE[role];
}