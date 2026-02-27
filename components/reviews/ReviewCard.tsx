type ReviewCardProps = {
  id: string;
  artifactTitle: string;
  learnerName: string;
  submittedAt: string;
  flagged?: boolean;
  onApprove: (id: string) => void;
  onReturn: (id: string) => void;
  onFlag: (id: string) => void;
};

export default function ReviewCard({
  id,
  artifactTitle,
  learnerName,
  submittedAt,
  flagged = false,
  onApprove,
  onReturn,
  onFlag,
}: ReviewCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{artifactTitle}</h2>
        {flagged && (
          <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Flagged
          </span>
        )}
      </div>
      <p className="mt-1 text-slate-500">
        By {learnerName} · {submittedAt}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
          onClick={() => onApprove(id)}
        >
          Approve
        </button>
        <button
          type="button"
          className="rounded border border-amber-400 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
          onClick={() => onReturn(id)}
        >
          Return
        </button>
        <button
          type="button"
          className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          onClick={() => onFlag(id)}
        >
          Flag
        </button>
      </div>
    </article>
  );
}
