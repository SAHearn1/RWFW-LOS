"use client";

type LicenseRow = {
  id: string;
  district: string;
  plan: "Basic" | "Pro";
  seats: number;
  expires: string;
  status: "active" | "expired";
};

const MOCK_LICENSES: LicenseRow[] = [
  {
    id: "lic_001",
    district: "Springfield Unified School District",
    plan: "Pro",
    seats: 200,
    expires: "2026-08-31",
    status: "active",
  },
  {
    id: "lic_002",
    district: "Lincoln Academy",
    plan: "Basic",
    seats: 25,
    expires: "2026-06-30",
    status: "active",
  },
];

const STATUS_STYLES: Record<LicenseRow["status"], string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-700",
};

export default function LicensesPanel() {
  return (
    <div className="space-y-6" data-tour="licenses-panel">
      <div>
        <h1 className="text-2xl font-semibold" data-tour="page-title">
          Licenses
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Institutional license allocations, plan tiers, and seat counts.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">District</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Seats</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_LICENSES.map((lic) => (
              <tr key={lic.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{lic.district}</td>
                <td className="px-4 py-3 text-slate-600">{lic.plan}</td>
                <td className="px-4 py-3 text-slate-500">{lic.seats}</td>
                <td className="px-4 py-3 text-slate-400">{lic.expires}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[lic.status]}`}
                  >
                    {lic.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Showing scaffold demo data. Live license data requires license store integration.
      </p>
    </div>
  );
}
