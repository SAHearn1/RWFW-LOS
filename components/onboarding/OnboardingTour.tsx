"use client";

import { useEffect, useMemo, useState } from "react";

import type { AppRole } from "@/lib/auth/roles";
import { getClientFlagSnapshot, resolveTourSteps } from "@/lib/onboarding/resolveSteps";

type OnboardingTourProps = {
  role: AppRole;
};

const HIGHLIGHT_CLASS = "ring-2 ring-sky-500 ring-offset-2";

function getStorageKey(role: AppRole): string {
  return `rootwork.tour.completed.${role}`;
}

export default function OnboardingTour({ role }: OnboardingTourProps) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);

  const steps = useMemo(() => {
    return resolveTourSteps({ role, flags: getClientFlagSnapshot() });
  }, [role]);

  useEffect(() => {
    const completed = window.localStorage.getItem(getStorageKey(role)) === "true";
    if (!completed) {
      setStarted(true);
      setIndex(0);
    }

    const restart = () => {
      window.localStorage.removeItem(getStorageKey(role));
      setStarted(true);
      setIndex(0);
    };

    window.addEventListener("rootwork:restart-tour", restart);
    return () => window.removeEventListener("rootwork:restart-tour", restart);
  }, [role]);

  const safeSteps = useMemo(() => {
    return steps.filter((step) => document.querySelector(step.selector));
  }, [steps, started, index]);

  const activeStep = started ? safeSteps[index] : null;

  useEffect(() => {
    if (!activeStep) {
      return;
    }

    const target = document.querySelector(activeStep.selector);
    if (!target) {
      return;
    }

    target.classList.add(...HIGHLIGHT_CLASS.split(" "));
    return () => {
      target.classList.remove(...HIGHLIGHT_CLASS.split(" "));
    };
  }, [activeStep]);

  if (!started || !activeStep) {
    return null;
  }

  const finish = () => {
    window.localStorage.setItem(getStorageKey(role), "true");
    setStarted(false);
    setIndex(0);
  };

  const next = () => {
    if (index + 1 >= safeSteps.length) {
      finish();
      return;
    }

    setIndex((value) => value + 1);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl" role="dialog" aria-live="polite">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Guided Onboarding</p>
      <h2 className="mt-1 text-base font-semibold text-slate-900">{activeStep.title}</h2>
      <p className="mt-2 text-sm text-slate-700">{activeStep.body}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={finish}>
          Skip
        </button>
        <button type="button" className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" onClick={next}>
          {index + 1 >= safeSteps.length ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
