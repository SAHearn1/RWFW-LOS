"use client";

type UserRow = {
  id: string;
  name: string;
  role: string;
  lastActive: string;
};

const MOCK_USERS: UserRow[] = [
  { id: "usr_001", name: "Alice Chen", role: "student_independent", lastActive: "2026-02-25" },
  { id: "usr_002", name: "Bob Torres", role: "student_enrolled", lastActive: "2026-02-24" },
  { id: "usr_003", name: "Carol Singh", role: "teacher", lastActive: "2026-02-26" },
];

const ROLE_STYLES: Record<string, string> = {
  student_independent: "bg-sky-100 text-sky-800",
  student_enrolled: "bg-blue-100 text-blue-800",
  adult_learner: "bg-teal-100 text-teal-800",
  teacher: "bg-amber-100 text-amber-800",
  professional_development: "bg-purple-100 text-purple-800",
  admin: "bg-slate-200 text-slate-700",
  super_admin: "bg-red-100 text-red-800",
};

export default function UsersPanel() {
  return (
    <div className="space-y-6" data-tour="user-roster-entry">
      <div>
        <h1 className="text-2xl font-semibold" data-tour="page-title">
          Users
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Platform user accounts and role assignments.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="search"
          disabled
          placeholder="Search users — coming soon"
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
          aria-disabled="true"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Last Active</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[user.role] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{user.lastActive}</td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-400">—</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Showing scaffold demo data. Live user data requires Clerk Management API integration.
      </p>
    </div>
  );
}
