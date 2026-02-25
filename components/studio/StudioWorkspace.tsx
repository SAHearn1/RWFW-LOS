export default function StudioWorkspace() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Studio</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Create, revise, and submit artifacts in the studio workspace.
      </p>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        Studio migration is active in Next.js with deterministic placeholder behavior.
      </div>
    </section>
  );
}
