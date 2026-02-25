type CohortCardProps = {
  name: string;
  learnerCount: number;
  status: "active" | "completed" | "pending";
};

export default function CohortCard({ name, learnerCount, status }: CohortCardProps) {
  const colors: Record<CohortCardProps["status"], string> = {
    active: "bg-green-100 text-green-800",
    completed: "bg-slate-100 text-slate-700",
    pending: "bg-amber-100 text-amber-800",
  };
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="flex items-start justify-between">
        <h2 className="font-semibold text-slate-900">{name}</h2>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status]}`}>{status}</span>
      </div>
      <p className="mt-1 text-slate-600">{learnerCount} learner{learnerCount !== 1 ? "s" : ""}</p>
    </article>
  );
}
