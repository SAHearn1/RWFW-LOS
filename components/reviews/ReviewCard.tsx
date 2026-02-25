type ReviewCardProps = {
  artifactTitle: string;
  learnerName: string;
  submittedAt: string;
};

export default function ReviewCard({ artifactTitle, learnerName, submittedAt }: ReviewCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <h2 className="font-semibold text-slate-900">{artifactTitle}</h2>
      <p className="mt-1 text-slate-500">By {learnerName} · {submittedAt}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">Approve</button>
        <button type="button" className="rounded border border-amber-400 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">Return</button>
        <button type="button" className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Flag</button>
      </div>
    </article>
  );
}
