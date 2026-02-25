"use client";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <section className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-950">
        <h1 className="text-xl font-semibold">App Route Error</h1>
        <p className="text-sm">{error.message || "An unexpected route error occurred."}</p>
        <button className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" onClick={reset} type="button">
          Retry
        </button>
      </section>
    </main>
  );
}
