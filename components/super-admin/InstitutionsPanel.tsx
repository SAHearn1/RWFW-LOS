"use client";

const MOCK_INSTITUTIONS = [
  { id: "inst_001", name: "Springfield Unified School District", teacherCount: 42, status: "active" as const },
  { id: "inst_002", name: "Lincoln Academy", teacherCount: 8, status: "active" as const },
];

export default function InstitutionsPanel() {
  return (
    <div className="space-y-6" data-tour="institutions-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-tour="page-title">
            Institutions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage institution accounts and delegate local admin access.
          </p>
        </div>
        <div title="Institution creation is not yet available." className="inline-block">
          <button
            type="button"
            disabled
            className="rounded border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed select-none"
            aria-disabled="true"
          >
            Add Institution &mdash; Coming soon
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_INSTITUTIONS.map((inst) => (
          <div
            key={inst.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">{inst.name}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {inst.teacherCount} teacher{inst.teacherCount !== 1 ? "s" : ""}
                </p>
              </div>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  inst.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {inst.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Showing scaffold demo data. Live institution data requires Clerk org integration.
      </p>
    </div>
  );
}
