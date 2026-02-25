import { phase1FeatureFlags } from "@/lib/config/featureFlags";

export default function PortfolioView() {
  const ledgerEnabled = phase1FeatureFlags.enableLedger;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Portfolio</h1>
      <p className="text-sm text-slate-700">
        Your evidence portfolio — saved artifacts, verification results, and credential progress.
      </p>
      {!ledgerEnabled && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Portfolio evidence requires the ledger feature. Contact your administrator.
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Submitted Artifacts</h2>
          <p className="mt-1 text-slate-600">Artifacts saved in Studio appear here once submitted for review.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Verification Results</h2>
          <p className="mt-1 text-slate-600">Standards verification outcomes for each submitted artifact are recorded here.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Credential Progress</h2>
          <p className="mt-1 text-slate-600">Track progress toward credentials as your portfolio of verified work grows.</p>
        </article>
      </div>
      <p className="mt-4 text-sm text-slate-500">No artifacts yet. Save work in Studio to build your portfolio.</p>
    </section>
  );
}
