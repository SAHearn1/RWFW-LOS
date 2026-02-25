import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-600">RootWork LOS</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Learning operations built for calm, focused progress.</h1>
        <p className="max-w-3xl text-base text-slate-700">
          RootWork aligns learner agency, teacher guidance, and administrator visibility in one respectful workflow.
          Start quickly, verify progress clearly, and keep evidence organized without adding noise.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Independent Learners</h2>
          <p className="mt-2 text-sm text-slate-700">Begin missions, build artifacts, and track credentials in a single workspace.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Teachers</h2>
          <p className="mt-2 text-sm text-slate-700">Coordinate cohorts, review evidence, and guide next actions with clarity.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Administrators</h2>
          <p className="mt-2 text-sm text-slate-700">Monitor standards and exports with consistent governance controls.</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold">First 60 seconds</h2>
        <pre className="mt-3 overflow-auto rounded bg-slate-50 p-4 text-sm text-slate-800">
{`/  -> Start as Independent Learner
   -> /sign-up
   -> /app (PLE)
   -> /app/missions
   -> /app/studio`}
        </pre>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold">Privacy and Safety by Design</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Explicit role boundaries for learner, teacher, and admin paths.</li>
          <li>Deterministic route controls and clear access messaging.</li>
          <li>Feature flags to ship safely without hidden behavior.</li>
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/sign-up">
          Start as Independent Learner
        </Link>
        <Link className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800" href="/sign-in">
          Teacher Login
        </Link>
        <Link className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800" href="/admin-info">
          Admin Info
        </Link>
      </section>
    </main>
  );
}
