import Link from "next/link";

import { FIVE_RS } from "@/components/brand/FiveRsIcons";
import RootworkMark from "@/components/brand/RootworkMark";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-16">

      {/* ── Brand hero ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <RootworkMark className="h-12 w-auto" />
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-rootwork-olive opacity-70">
              Learning Operating System
            </p>
            <p className="font-serif text-2xl font-semibold text-rootwork-ink">RootWork</p>
          </div>
        </div>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-rootwork-ink">
          Learning operations built for calm, focused progress.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-700">
          RootWork aligns learner agency, teacher guidance, and administrator visibility
          in one respectful workflow. Start quickly, verify progress clearly, and keep
          evidence organized without adding noise.
        </p>
      </section>

      {/* ── Five R's framework ─────────────────────────────────────── */}
      <section>
        <h2 className="mb-6 font-serif text-xl font-semibold text-rootwork-ink">
          The Five R&apos;s
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FIVE_RS.map(({ id, label, Icon, description }) => (
            <article
              key={id}
              className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-center"
            >
              <Icon className="h-16 w-16" />
              <h3 className="font-serif text-base font-semibold text-rootwork-olive">{label}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Who it's for ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold text-rootwork-ink">
          Who it&apos;s for
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center gap-2">
              {/* Roots icon small */}
              <svg viewBox="0 0 32 36" fill="none" className="h-6 w-auto" aria-hidden="true">
                <line x1="16" y1="28" x2="16" y2="10" stroke="#4A4A35" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M16 19 C9 12 3 16 6 22 C10 20 14 19 16 19Z" fill="#6BAF8A"/>
                <path d="M16 19 C23 12 29 16 26 22 C22 20 18 19 16 19Z" fill="#6BAF8A"/>
                <path d="M16 28 L9 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M16 28 L16 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M16 28 L23 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <h3 className="font-semibold text-rootwork-ink">Independent Learners</h3>
            </div>
            <p className="text-sm text-slate-700">
              Begin missions, build artifacts, and track credentials in a single workspace.
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center gap-2">
              {/* Relate icon small */}
              <svg viewBox="0 0 96 96" fill="none" className="h-6 w-auto" aria-hidden="true">
                <path d="M6 76 L6 42 C6 28 14 18 26 18 C38 18 44 28 44 42 C44 54 38 62 34 66 L34 76 Z" fill="#3D7A6A"/>
                <path d="M90 76 L90 42 C90 28 82 18 70 18 C58 18 52 28 52 42 C52 54 58 62 62 66 L62 76 Z" fill="#3D7A6A"/>
                <line x1="48" y1="76" x2="48" y2="36" stroke="#6BAF8A" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <h3 className="font-semibold text-rootwork-ink">Teachers</h3>
            </div>
            <p className="text-sm text-slate-700">
              Coordinate cohorts, review evidence, and guide next actions with clarity.
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center gap-2">
              {/* Radiate icon small */}
              <svg viewBox="0 0 96 96" fill="none" className="h-6 w-auto" aria-hidden="true">
                <line x1="48" y1="6" x2="48" y2="20" stroke="#C5A059" strokeWidth="3" strokeLinecap="round"/>
                <line x1="76" y1="14" x2="67" y2="25" stroke="#C5A059" strokeWidth="3" strokeLinecap="round"/>
                <line x1="20" y1="14" x2="29" y2="25" stroke="#C5A059" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="48" cy="52" r="20" fill="#3D7A6A"/>
                <circle cx="48" cy="52" r="8" fill="#C5A059"/>
              </svg>
              <h3 className="font-semibold text-rootwork-ink">Administrators</h3>
            </div>
            <p className="text-sm text-slate-700">
              Monitor standards and exports with consistent governance controls.
            </p>
          </article>
        </div>
      </section>

      {/* ── Privacy callout ────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-lg font-semibold text-rootwork-ink">Privacy and Safety by Design</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Explicit role boundaries for learner, teacher, and admin paths.</li>
          <li>Deterministic route controls and clear access messaging.</li>
          <li>Feature flags to ship safely without hidden behavior.</li>
        </ul>
      </section>

      {/* ── CTAs ───────────────────────────────────────────────────── */}
      <section className="flex flex-wrap gap-3">
        <Link
          className="rounded bg-rootwork-olive px-5 py-2.5 text-sm font-medium text-rootwork-bg hover:opacity-90"
          href="/sign-up"
        >
          Start as Independent Learner
        </Link>
        <Link
          className="rounded border border-rootwork-gold px-5 py-2.5 text-sm font-medium text-rootwork-olive hover:bg-rootwork-gold/10"
          href="/sign-in"
        >
          Teacher Login
        </Link>
        <Link
          className="rounded border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          href="/sign-in"
        >
          Admin Info
        </Link>
      </section>
    </main>
  );
}
