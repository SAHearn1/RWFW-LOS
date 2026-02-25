"use client";

import type { UserRecord } from "@/lib/licensing/types";

const ROLE_BADGE: Record<string, string> = {
  student_independent: "bg-sky-100 text-sky-800",
  student_enrolled: "bg-blue-100 text-blue-800",
  adult_learner: "bg-teal-100 text-teal-800",
  teacher: "bg-amber-100 text-amber-800",
  professional_development: "bg-purple-100 text-purple-800",
  admin: "bg-slate-200 text-slate-700",
  super_admin: "bg-red-100 text-red-800",
};

// Scaffold demo data — replace with API call when user management API is implemented
const DEMO_USERS: UserRecord[] = [
  { userId: "usr_001", email: "alice@lincoln.edu", fullName: "Alice Chen", role: "student_independent", orgId: null, tenantId: null, createdAtIso: "2026-01-10T09:00:00Z" },
  { userId: "usr_002", email: "bob@lincoln.edu", fullName: "Bob Torres", role: "student_enrolled", orgId: "org_lincoln", tenantId: "tenant_001", createdAtIso: "2026-01-11T10:00:00Z" },
  { userId: "usr_003", email: "carol@lincoln.edu", fullName: "Carol Singh", role: "teacher", orgId: "org_lincoln", tenantId: "tenant_001", createdAtIso: "2026-01-12T08:30:00Z" },
  { userId: "usr_004", email: "david@pd.org", fullName: "David Park", role: "professional_development", orgId: "org_pdnet", tenantId: "tenant_002", createdAtIso: "2026-01-15T14:00:00Z" },
  { userId: "usr_005", email: "eve@district.gov", fullName: "Eve Marshall", role: "admin", orgId: "org_district", tenantId: "tenant_003", createdAtIso: "2026-01-20T11:00:00Z" },
];

export default function UserRoster() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 data-tour="page-title" className="text-xl font-semibold text-slate-800">
            User Roster
          </h1>
          <p className="mt-1 text-sm text-slate-500">All platform accounts. Role changes are applied via Teacher Assignment.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {DEMO_USERS.length} users (demo)
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Org</th>
              <th className="px-4 py-3 text-left">Tenant</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DEMO_USERS.map((u) => (
              <tr key={u.userId} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.fullName}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.orgId ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{u.tenantId ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{u.createdAtIso.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Live user data requires a Clerk Management API integration. This view shows scaffold demo records.
      </p>
    </div>
  );
}
