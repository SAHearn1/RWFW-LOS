"use client";

type TeacherRow = {
  id: string;
  name: string;
  institution: string;
  roleLabel: string;
  status: "active" | "pending";
};

const MOCK_TEACHERS: TeacherRow[] = [
  { id: "t_001", name: "Carol Singh", institution: "Springfield Unified", roleLabel: "Teacher", status: "active" },
  { id: "t_002", name: "Maria Okonkwo", institution: "Lincoln Academy", roleLabel: "Teacher", status: "active" },
  { id: "t_003", name: "James Reyes", institution: "Springfield Unified", roleLabel: "Professional Development", status: "pending" },
];

const STATUS_STYLES: Record<TeacherRow["status"], string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
};

export default function TeachersPanel() {
  return (
    <div className="space-y-6" data-tour="teachers-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-tour="page-title">
            Teachers
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Educator accounts and their institutional assignments. Only super-admins may grant the
            teacher role.
          </p>
        </div>
        <div title="Teacher invitation is not yet available." className="inline-block">
          <button
            type="button"
            disabled
            className="rounded border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed select-none"
            aria-disabled="true"
          >
            Invite Teacher &mdash; Coming soon
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Institution</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_TEACHERS.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{teacher.name}</td>
                <td className="px-4 py-3 text-slate-500">{teacher.institution}</td>
                <td className="px-4 py-3 text-slate-500">{teacher.roleLabel}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[teacher.status]}`}
                  >
                    {teacher.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Showing scaffold demo data. Live teacher data requires Clerk Management API integration.
      </p>
    </div>
  );
}
