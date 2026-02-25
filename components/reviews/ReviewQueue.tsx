import ReviewCard from "./ReviewCard";

export default function ReviewQueue() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Review Queue</h1>
      <p className="text-sm text-slate-700">
        Triage submitted artifacts. Approve, return for revision, or flag submissions needing attention.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <ReviewCard
          artifactTitle="Mission Reflection: Community Impact"
          learnerName="Alex Rivera"
          submittedAt="Feb 24, 2026"
        />
        <ReviewCard
          artifactTitle="Artifact: Systems Thinking Analysis"
          learnerName="Jordan Lee"
          submittedAt="Feb 23, 2026"
        />
        <ReviewCard
          artifactTitle="Mission Draft: Learning Pathways"
          learnerName="Sam Patel"
          submittedAt="Feb 22, 2026"
        />
      </div>
      <p className="mt-4 text-xs text-slate-400">Live submissions will populate from the ledger when enabled.</p>
    </section>
  );
}
