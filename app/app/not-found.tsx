export default function AppNotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-900">
        <h1 className="text-xl font-semibold">Route Not Found</h1>
        <p className="text-sm">The requested app route does not exist.</p>
      </section>
    </main>
  );
}
