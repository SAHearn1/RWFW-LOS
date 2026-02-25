import Link from "next/link";

const TRACE_STEPS = ["TARGET", "REASON", "APPLY", "CREATE", "EVALUATE"] as const;

const FIVE_RS = [
  { label: "ROOT", sub: "Identity & Purpose" },
  { label: "REGULATE", sub: "Readiness for Learning" },
  { label: "REFLECT", sub: "Critical Awareness" },
  { label: "RESTORE", sub: "Feedback & Mastery" },
  { label: "RECONNECT", sub: "Community Application" },
] as const;

export default function HomePage() {
  return (
    <main className="font-sans text-[#1a1a1a]">

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#052a1f] to-[#0a4a37] text-white text-center py-36 px-[8%]">
        <h1 className="text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
          Rigor Reimagined for the Age of Artificial Intelligence
        </h1>
        <p className="max-w-3xl mx-auto text-base text-green-100 mb-10 leading-relaxed">
          The RootWork Learning Operating System prepares learners to think critically,
          adapt intelligently, and lead responsibly in a world shaped by artificial intelligence,
          innovation, and global change.
        </p>
        <Link
          href="/sign-up"
          className="bg-[#caa64a] text-black font-semibold px-7 py-4 rounded-md inline-block hover:opacity-90 transition-opacity"
        >
          Request Institutional Licensing
        </Link>
      </section>

      {/* ACADEMIC RIGOR */}
      <section className="py-24 px-[8%] max-w-[1300px] mx-auto">
        <h2 className="text-4xl font-semibold mb-8">Academic Rigor — Answered First</h2>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-slate-700 leading-relaxed">
              RootWork defines rigor through demonstrated mastery, intellectual reasoning,
              and transferable performance—not workload accumulation. Learners must explain
              thinking, apply knowledge in unfamiliar contexts, revise through feedback, and
              produce authentic evidence of understanding.
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl bg-white p-8 text-center shadow-sm">
            <h3 className="text-lg font-semibold mb-5">RootWork Rigor Standards</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>Evidence-Based Mastery</li>
              <li>Higher-Order Reasoning</li>
              <li>AI Collaboration Literacy</li>
              <li>Real-World Application</li>
            </ul>
          </div>
        </div>
      </section>

      {/* TRACE™ */}
      <section className="bg-[#f5f7f6] py-24 px-[8%]">
        <div className="max-w-[1300px] mx-auto">
          <h2 className="text-4xl font-semibold mb-4">TRACE™ Cognitive Architecture</h2>
          <p className="text-slate-600 mb-10 max-w-3xl leading-relaxed">
            TRACE™ develops Epistemic Fluency™—the ability to evaluate, synthesize, and
            responsibly apply knowledge in AI-rich environments.
          </p>
          <div className="grid gap-4 sm:grid-cols-5">
            {TRACE_STEPS.map((step) => (
              <div
                key={step}
                className="border border-slate-200 rounded-xl bg-white px-4 py-6 text-center font-semibold text-slate-900 shadow-sm"
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5Rs™ */}
      <section className="py-24 px-[8%] max-w-[1300px] mx-auto">
        <h2 className="text-4xl font-semibold mb-10">The RootWork 5Rs™ Learning Progression</h2>
        <div className="grid gap-4 sm:grid-cols-5">
          {FIVE_RS.map(({ label, sub }) => (
            <div key={label} className="border border-slate-200 rounded-xl bg-white p-6 text-center shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-1">{label}</h3>
              <p className="text-sm text-slate-600">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI DESIGN */}
      <section className="bg-[#f5f7f6] py-24 px-[8%]">
        <div className="max-w-[1300px] mx-auto">
          <h2 className="text-4xl font-semibold mb-10">Artificial Intelligence — Purposefully Designed</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="border border-slate-200 rounded-xl bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold mb-5">AI Enables</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>Personalized learning pathways</li>
                <li>Educator decision support</li>
                <li>Learning scaffolds</li>
                <li>Evidence tracking</li>
              </ul>
            </div>
            <div className="border border-slate-200 rounded-xl bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold mb-5">AI Guardrails</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>Preserves rigor</li>
                <li>Maintains authorship</li>
                <li>Supports educators</li>
                <li>Protects integrity</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FUTURE */}
      <section className="py-24 px-[8%] max-w-[1300px] mx-auto">
        <h2 className="text-4xl font-semibold mb-4">Preparing Learners for the 21st Century and Beyond</h2>
        <p className="text-slate-700 max-w-3xl leading-relaxed">
          RootWork equips learners to collaborate with intelligent systems, navigate emerging
          industries, and innovate responsibly within rapidly changing global economies.
        </p>
      </section>

      {/* WELLNESS */}
      <section className="bg-[#f5f7f6] py-24 px-[8%]">
        <div className="max-w-[1300px] mx-auto">
          <h2 className="text-4xl font-semibold mb-4">Wellness as Learning Infrastructure</h2>
          <p className="text-slate-700 max-w-3xl leading-relaxed">
            Regulation, reflection, restorative engagement, and community participation are
            embedded directly into learning environments—making sustained rigorous learning possible.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-[8%] text-center">
        <h2 className="text-4xl font-semibold mb-8">Build Future-Ready Learning Infrastructure</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/sign-up"
            className="bg-[#caa64a] text-black font-semibold px-7 py-4 rounded-md inline-block hover:opacity-90 transition-opacity"
          >
            Start as Independent Learner
          </Link>
          <Link
            href="/sign-in?role=teacher"
            className="border border-slate-300 bg-white text-slate-800 font-medium px-7 py-4 rounded-md inline-block hover:bg-slate-50 transition-colors"
          >
            Teacher Login
          </Link>
          <Link
            href="/sign-in?role=admin"
            className="border border-slate-300 bg-white text-slate-800 font-medium px-7 py-4 rounded-md inline-block hover:bg-slate-50 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#063b2d] text-white py-12 text-center">
        <p className="font-medium">RootWork Learning Operating System™</p>
        <p className="mt-2 text-sm text-green-200">
          TRACE™ &bull; Epistemic Fluency™ &bull; 5Rs™ &bull; Dual-Purpose Pedagogy™
        </p>
      </footer>

    </main>
  );
}
