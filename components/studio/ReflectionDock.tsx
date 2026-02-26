"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

import { FIVE_RS, FIVE_RS_ORDERED, type FiveRStep } from "@/lib/cognition/fiveRs";

type ReflectionEntry = {
  step: FiveRStep;
  text: string;
  savedAt: string;
};

type Props = {
  missionId?: string;
  onSave?: (entry: ReflectionEntry) => void;
};

export default function ReflectionDock({ onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<FiveRStep>("root");
  const [drafts, setDrafts] = useState<Partial<Record<FiveRStep, string>>>({});
  const [saved, setSaved] = useState<Partial<Record<FiveRStep, boolean>>>({});

  function handleSave(step: FiveRStep) {
    const text = drafts[step]?.trim();
    if (!text) return;
    const entry: ReflectionEntry = { step, text, savedAt: new Date().toISOString() };
    onSave?.(entry);
    setSaved((prev) => ({ ...prev, [step]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [step]: false })), 2000);
  }

  const stepConfig = FIVE_RS[activeStep];

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-rootwork-gold/15 px-2 py-0.5 text-xs font-semibold text-rootwork-gold">5Rs</span>
          Reflection Dock
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4">
          {/* Step tabs */}
          <div className="flex gap-1 flex-wrap">
            {FIVE_RS_ORDERED.map((step) => {
              const config = FIVE_RS[step];
              const isActive = step === activeStep;
              const hasDraft = Boolean(drafts[step]?.trim());
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setActiveStep(step)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-rootwork-gold text-rootwork-ink"
                      : hasDraft
                      ? "bg-rootwork-gold/10 text-rootwork-olive border border-rootwork-gold/30"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Active step prompt + textarea */}
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-slate-700">{stepConfig.label} — {stepConfig.description}</p>
              <p className="mt-0.5 text-xs text-slate-500 italic">{stepConfig.prompt}</p>
            </div>
            <textarea
              value={drafts[activeStep] ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [activeStep]: e.target.value }))}
              placeholder="Write your reflection here…"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:border-rootwork-gold focus:outline-none focus:ring-1 focus:ring-rootwork-gold/30 transition"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSave(activeStep)}
                disabled={!drafts[activeStep]?.trim()}
                className="rounded-lg bg-rootwork-gold px-4 py-1.5 text-xs font-semibold text-rootwork-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saved[activeStep] ? "Saved ✓" : "Save Reflection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
