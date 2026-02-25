import { phase1FeatureFlags } from "@/lib/config/featureFlags";

export default function PickupsWorkspace() {
  if (!phase1FeatureFlags.enablePickup) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold" data-tour="page-title">Pickups</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Pickups feature is not currently enabled.</p>
          <p className="mt-1">Set <code>NEXT_PUBLIC_ENABLE_PICKUP=true</code> to activate this feature.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Pickups</h1>
      <p className="text-sm text-slate-700">Manage pickup assignments for learners in your cohorts.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Pending Pickups</h2>
          <p className="mt-1 text-slate-600">Learners awaiting pickup assignment appear here.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">In Progress</h2>
          <p className="mt-1 text-slate-600">Active pickup assignments currently being fulfilled.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Completed</h2>
          <p className="mt-1 text-slate-600">Completed pickups and fulfillment history.</p>
        </article>
      </div>
    </section>
  );
}
