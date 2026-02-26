import Link from "next/link";
import { CheckCircle2, Shield, Flag, GraduationCap, Users, LayoutDashboard } from "lucide-react";

import { FIVE_RS } from "@/components/brand/FiveRsIcons";
import RootworkMark from "@/components/brand/RootworkMark";

/* ─────────────────────────────────────────────────────────────────────────────
   Landing Page
   ───────────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F7F2" }}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#F8F7F2]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <RootworkMark wordmark className="h-7" />
          <nav className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-rootwork-olive transition-colors hover:bg-rootwork-olive/10"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-rootwork-olive px-4 py-2 text-sm font-medium text-rootwork-bg transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Decorative background rings */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-[480px] w-[480px] rounded-full border border-rootwork-sage/15" />
            <div className="absolute h-[680px] w-[680px] rounded-full border border-rootwork-gold/10" />
            <div className="absolute h-[900px] w-[900px] rounded-full border border-rootwork-sage/8" />
          </div>

          <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-20 text-center">
            {/* Brand mark */}
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-rootwork-sage/30 bg-white shadow-sm">
              <RootworkMark className="h-14 w-auto" />
            </div>

            {/* Eyebrow */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-rootwork-gold">
              Learning Operating System
            </p>

            {/* Headline */}
            <h1 className="mb-6 font-serif text-5xl font-semibold leading-tight tracking-tight text-rootwork-ink sm:text-6xl">
              Learning built for{" "}
              <span className="text-rootwork-teal">calm, focused</span>{" "}
              progress.
            </h1>

            {/* Sub-headline */}
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-600">
              RootWork aligns learner agency, teacher guidance, and administrator
              visibility in one respectful workflow. Start quickly, verify progress
              clearly, and keep evidence organized without adding noise.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-up"
                className="rounded-xl bg-rootwork-olive px-6 py-3 text-sm font-semibold text-rootwork-bg shadow-sm transition-opacity hover:opacity-90"
              >
                Start as Independent Learner
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl border border-rootwork-gold bg-white px-6 py-3 text-sm font-semibold text-rootwork-olive shadow-sm transition-colors hover:bg-rootwork-gold/10"
              >
                Teacher Login
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                Admin Info
              </Link>
            </div>
          </div>
        </section>

        {/* ── Divider ───────────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        {/* ── Five R's ──────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rootwork-gold">
              The Framework
            </p>
            <h2 className="font-serif text-3xl font-semibold text-rootwork-ink">
              The Five R&apos;s
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              Every workflow in RootWork is grounded in five core principles —
              a relational approach to learning that centers growth, not compliance.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {FIVE_RS.map(({ id, label, Icon, description }, i) => (
              <article
                key={id}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-rootwork-sage/50 hover:shadow-md"
              >
                {/* Step number */}
                <span className="text-xs font-semibold tabular-nums text-rootwork-gold/70">
                  0{i + 1}
                </span>
                <Icon className="h-16 w-16 transition-transform duration-200 group-hover:scale-105" />
                <div>
                  <h3 className="mb-1.5 font-serif text-base font-semibold text-rootwork-teal">
                    {label}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-500">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Who it's for ──────────────────────────────────────────────────── */}
        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rootwork-gold">
                Built for every role
              </p>
              <h2 className="font-serif text-3xl font-semibold text-rootwork-ink">
                Who it&apos;s for
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Learner */}
              <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-[#F8F7F2] p-7 transition-all hover:border-rootwork-sage/50 hover:shadow-md">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rootwork-sage/15">
                  <GraduationCap className="h-6 w-6 text-rootwork-teal" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-rootwork-ink">
                  Independent Learners
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">
                  Begin missions, build artifacts, and track credentials in a single
                  workspace. Your progress, your pace.
                </p>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-rootwork-teal transition-colors hover:text-rootwork-olive"
                >
                  Start for free
                  <span aria-hidden="true">→</span>
                </Link>
                {/* Decorative icon */}
                <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-5">
                  <GraduationCap className="h-32 w-32 text-rootwork-teal" />
                </div>
              </article>

              {/* Teacher */}
              <article className="group relative overflow-hidden rounded-2xl border border-rootwork-gold/30 bg-white p-7 shadow-sm transition-all hover:border-rootwork-gold/60 hover:shadow-md">
                {/* Accent top bar */}
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-rootwork-gold/40 via-rootwork-gold to-rootwork-gold/40" />
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rootwork-gold/15">
                  <Users className="h-6 w-6 text-rootwork-gold" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-rootwork-ink">
                  Teachers
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">
                  Coordinate cohorts, review evidence, and guide next actions with
                  clarity. Less admin noise, more meaningful feedback.
                </p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-rootwork-gold transition-colors hover:text-rootwork-olive"
                >
                  Teacher login
                  <span aria-hidden="true">→</span>
                </Link>
                <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-5">
                  <Users className="h-32 w-32 text-rootwork-gold" />
                </div>
              </article>

              {/* Admin */}
              <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-[#F8F7F2] p-7 transition-all hover:border-rootwork-sage/50 hover:shadow-md">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rootwork-teal/10">
                  <LayoutDashboard className="h-6 w-6 text-rootwork-teal" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-rootwork-ink">
                  Administrators
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">
                  Monitor standards and exports with consistent governance controls.
                  Full visibility without micromanagement.
                </p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-rootwork-teal transition-colors hover:text-rootwork-olive"
                >
                  Admin info
                  <span aria-hidden="true">→</span>
                </Link>
                <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-5">
                  <LayoutDashboard className="h-32 w-32 text-rootwork-teal" />
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ── Privacy & Design ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rootwork-gold">
                Principles
              </p>
              <h2 className="font-serif text-3xl font-semibold text-rootwork-ink">
                Privacy and Safety by Design
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rootwork-teal/10">
                  <Shield className="h-6 w-6 text-rootwork-teal" />
                </div>
                <h3 className="font-semibold text-rootwork-ink">Role Boundaries</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Explicit role boundaries for learner, teacher, and admin paths.
                  No cross-role data bleed.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rootwork-gold/10">
                  <Flag className="h-6 w-6 text-rootwork-gold" />
                </div>
                <h3 className="font-semibold text-rootwork-ink">Feature Flags</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Deterministic feature flags ship safely. When a flag is off,
                  the UI degrades gracefully — never crashes.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rootwork-sage/15">
                  <CheckCircle2 className="h-6 w-6 text-rootwork-teal" />
                </div>
                <h3 className="font-semibold text-rootwork-ink">Clear Access Messaging</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Deterministic route controls with clear access messaging — no
                  silent 403s or mysterious blank screens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
        <section
          className="border-t border-rootwork-olive/20"
          style={{ background: "#4A4A35" }}
        >
          <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
            <RootworkMark className="mb-6 h-12 w-auto opacity-90" />
            <h2 className="mb-4 font-serif text-3xl font-semibold text-rootwork-bg">
              Ready to get started?
            </h2>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-rootwork-bg/70">
              Join learners, teachers, and administrators who use RootWork to keep
              learning purposeful and progress visible.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-up"
                className="rounded-xl bg-rootwork-gold px-7 py-3 text-sm font-semibold text-rootwork-ink shadow-sm transition-opacity hover:opacity-90"
              >
                Start as Independent Learner
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl border border-rootwork-bg/30 px-7 py-3 text-sm font-semibold text-rootwork-bg/80 transition-colors hover:border-rootwork-bg/60 hover:text-rootwork-bg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <RootworkMark wordmark className="h-6 opacity-70" />
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} RootWork LOS
            </p>
          </div>
        </footer>

      </main>
    </div>
  );
}
