import Link from "next/link";

export default function ForbiddenPanel({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-950">
      <h1 className="text-xl font-semibold">403: Access Restricted</h1>
      <p className="mt-2 text-sm">{message}</p>
      <p className="mt-4 text-sm">
        If this seems incorrect, contact your administrator or return to your allowed workspace.
      </p>
      <div className="mt-5 flex gap-3">
        <Link className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/app">
          Return to Home
        </Link>
      </div>
    </section>
  );
}
