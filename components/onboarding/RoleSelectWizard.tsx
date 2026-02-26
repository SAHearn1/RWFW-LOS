"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Briefcase, BookOpen, Shield } from "lucide-react";

import type { AppRole } from "@/lib/auth/roles";

type LearnerRole = "student_independent" | "student_enrolled" | "adult_learner";

const LEARNER_ROLE_OPTIONS: {
  role: LearnerRole;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    role: "student_independent",
    label: "Independent Learner",
    description: "Self-directed learner. Build missions, create artifacts, and track credentials at your own pace.",
    Icon: GraduationCap,
  },
  {
    role: "adult_learner",
    label: "Adult Learner",
    description: "Professional learning pathway. Goal-setting, studio access, and progress tracking for adult learners.",
    Icon: Briefcase,
  },
  {
    role: "student_enrolled",
    label: "Classroom Student",
    description: "Enrolled in a teacher's classroom. Join using a teacher invite code after setup.",
    Icon: BookOpen,
  },
];

type Step = "role" | "age" | "guardian";

type Props = {
  intendedRole: AppRole | null;
};

export default function RoleSelectWizard({ intendedRole }: Props) {
  const router = useRouter();
  const defaultSelection = (intendedRole as LearnerRole | null) ?? null;
  const [selected, setSelected] = useState<LearnerRole | null>(
    LEARNER_ROLE_OPTIONS.find((o) => o.role === defaultSelection) ? (defaultSelection as LearnerRole) : null
  );
  const [step, setStep] = useState<Step>("role");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMinorRole = selected === "student_independent" || selected === "student_enrolled";

  function handleAgeConfirm(is13OrOlder: boolean) {
    if (is13OrOlder) {
      void confirmRole(false);
    } else {
      setStep("guardian");
    }
  }

  async function confirmRole(requiresParentalConsent: boolean) {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selected,
          requiresParentalConsent,
          guardianEmail: requiresParentalConsent ? guardianEmail.trim() : undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to set role. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/app");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // ── Step: Guardian email ────────────────────────────────────────────────
  if (step === "guardian") {
    return (
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Shield className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-slate-800">Parent / Guardian Required</h1>
          <p className="mt-2 text-sm text-slate-500">
            Because you are under 13, we need a parent or guardian to verify consent before you continue.
          </p>
        </div>
        <div className="space-y-3 mb-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Guardian email address</span>
            <input
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              placeholder="guardian@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rootwork-teal focus:outline-none focus:ring-1 focus:ring-rootwork-teal/30"
            />
          </label>
          <p className="text-xs text-slate-400">
            We will record this for COPPA compliance. No email is sent at this stage.
          </p>
        </div>
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">{error}</p>
        )}
        <button
          type="button"
          disabled={!guardianEmail.trim() || loading}
          onClick={() => void confirmRole(true)}
          className="w-full rounded-xl bg-rootwork-olive px-6 py-3 text-sm font-semibold text-rootwork-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Saving…" : "Continue with Guardian Consent"}
        </button>
      </div>
    );
  }

  // ── Step: Age gate ──────────────────────────────────────────────────────
  if (step === "age") {
    return (
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-semibold text-slate-800">Quick age check</h1>
          <p className="mt-2 text-sm text-slate-500">
            This step is required to comply with child privacy regulations (COPPA).
          </p>
        </div>
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleAgeConfirm(true)}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-rootwork-teal hover:bg-rootwork-teal/5"
          >
            <p className="font-semibold text-sm text-slate-700">I am 13 or older</p>
            <p className="mt-0.5 text-xs text-slate-500">Continue directly to RootWork.</p>
          </button>
          <button
            type="button"
            onClick={() => handleAgeConfirm(false)}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-amber-300 hover:bg-amber-50"
          >
            <p className="font-semibold text-sm text-slate-700">I am under 13</p>
            <p className="mt-0.5 text-xs text-slate-500">A parent or guardian consent step is required.</p>
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Role selection ────────────────────────────────────────────────
  return (
    <div className="w-full max-w-xl">
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Welcome to RootWork</p>
        <h1 className="font-serif text-3xl font-semibold text-slate-800">How will you use RootWork?</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose your learning path. You can update this later in your profile.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {LEARNER_ROLE_OPTIONS.map(({ role, label, description, Icon }) => {
          const isSelected = selected === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelected(role)}
              className={[
                "w-full rounded-xl border p-5 text-left transition-all",
                isSelected
                  ? "border-rootwork-teal bg-rootwork-teal/5 ring-2 ring-rootwork-teal/30"
                  : "border-slate-200 bg-white hover:border-rootwork-sage/60 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <div className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  isSelected ? "bg-rootwork-teal/15" : "bg-slate-100",
                ].join(" ")}>
                  <Icon className={["h-5 w-5", isSelected ? "text-rootwork-teal" : "text-slate-400"].join(" ")} />
                </div>
                <div>
                  <p className={["font-semibold text-sm", isSelected ? "text-rootwork-teal" : "text-slate-700"].join(" ")}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
        <strong>Teacher or Admin?</strong> Sign in with your existing account. New teacher accounts require an invite code — contact your administrator.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">{error}</p>
      )}

      <button
        type="button"
        disabled={!selected || loading}
        onClick={() => {
          if (!selected) return;
          if (isMinorRole) {
            setStep("age");
          } else {
            void confirmRole(false);
          }
        }}
        className="w-full rounded-xl bg-rootwork-olive px-6 py-3 text-sm font-semibold text-rootwork-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Setting up your account…" : "Continue to RootWork"}
      </button>
    </div>
  );
}
