import type { StandardDescriptor } from "@/lib/standards/contracts/types";
import { DEFAULT_STANDARDS } from "@/lib/standards/verifier/localVerifier";

export default function StandardsRegistry() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Standards Registry</h1>
      <p className="text-sm text-slate-700">
        Active verification standards applied to artifacts in Studio. Read-only view.
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">Keywords</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(DEFAULT_STANDARDS as readonly StandardDescriptor[]).map((std) => (
              <tr key={std.id} className="bg-white">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{std.id}</td>
                <td className="px-4 py-3 text-slate-900">{std.title}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {std.requiredKeywords.map((kw) => (
                      <span key={kw} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{kw}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        {DEFAULT_STANDARDS.length} standard{DEFAULT_STANDARDS.length !== 1 ? "s" : ""} registered.
      </p>
    </section>
  );
}
