"use client";

import { useEffect, useState } from "react";
import { Play, SkipForward, Pause } from "lucide-react";

import { TRACE_PHASES } from "@/lib/cognition/trace";
import { SESSION_PHASES } from "@/lib/cognition/session";
import { useSessionTimer } from "@/lib/session/timer";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Map session phase → TRACE step
const SESSION_TO_TRACE: Record<string, string> = {
  arrival: "regulate",
  orientation: "trigger",
  "deep-work": "construct",
  collaboration: "attend",
  expression: "express",
  closure: "reflect",
};

export default function SessionPhaseBar() {
  const { state, start, advancePhase, pause, resume, phaseDurationSeconds, phaseLabel } = useSessionTimer();
  const [bodyFocusSuppressed, setBodyFocusSuppressed] = useState(false);

  const traceStepKey = SESSION_TO_TRACE[state.phase] ?? "trigger";
  const tracePhase = TRACE_PHASES[traceStepKey as keyof typeof TRACE_PHASES];
  const shouldSuppress = tracePhase?.focusSuppression ?? false;

  // Apply focus suppression class to document body
  useEffect(() => {
    if (shouldSuppress && state.status === "running") {
      document.body.classList.add("rw-focus-suppressed");
      setBodyFocusSuppressed(true);
    } else {
      document.body.classList.remove("rw-focus-suppressed");
      setBodyFocusSuppressed(false);
    }
    return () => {
      document.body.classList.remove("rw-focus-suppressed");
    };
  }, [shouldSuppress, state.status]);

  const progressRatio = phaseDurationSeconds > 0
    ? Math.min(state.elapsedSeconds / phaseDurationSeconds, 1)
    : 0;
  const remainingSeconds = Math.max(phaseDurationSeconds - state.elapsedSeconds, 0);
  const phaseConfig = SESSION_PHASES[state.phase];

  if (state.status === "idle") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <div>
          <span className="font-medium text-slate-700">60-minute TRACE Session</span>
          <span className="ml-2 text-slate-400 text-xs">Arrival → Orientation → Deep Work → Collaboration → Expression → Closure</span>
        </div>
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-1.5 rounded-lg bg-rootwork-teal px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Play className="h-3.5 w-3.5" />
          Start Session
        </button>
      </div>
    );
  }

  if (state.status === "complete") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-rootwork-teal/30 bg-rootwork-teal/5 px-4 py-3 text-sm">
        <span className="font-medium text-rootwork-teal">Session complete. Great work!</span>
        <span className="text-xs text-slate-500">Total: {formatTime(state.totalElapsedSeconds)}</span>
      </div>
    );
  }

  return (
    <div className={[
      "rounded-xl border px-4 py-3 transition-all",
      bodyFocusSuppressed
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white",
    ].join(" ")}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* TRACE badge */}
          <span className="rounded-full bg-rootwork-teal/10 px-2 py-0.5 text-xs font-semibold text-rootwork-teal uppercase tracking-wide">
            {traceStepKey.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-slate-700">{phaseLabel}</span>
          <span className="text-xs text-slate-400">{phaseConfig?.description}</span>
          {bodyFocusSuppressed && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Focus Mode</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-mono">{formatTime(remainingSeconds)} left</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-400">{formatTime(state.totalElapsedSeconds)} total</span>
          {state.status === "running" ? (
            <button type="button" onClick={pause} className="ml-1 rounded-lg border border-slate-200 p-1 hover:bg-slate-50" title="Pause session">
              <Pause className="h-3.5 w-3.5 text-slate-500" />
            </button>
          ) : (
            <button type="button" onClick={resume} className="ml-1 rounded-lg border border-slate-200 p-1 hover:bg-slate-50" title="Resume session">
              <Play className="h-3.5 w-3.5 text-slate-500" />
            </button>
          )}
          <button type="button" onClick={advancePhase} className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50" title="Advance to next phase">
            <SkipForward className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={[
            "h-full rounded-full transition-all duration-1000",
            bodyFocusSuppressed ? "bg-amber-400" : "bg-rootwork-teal",
          ].join(" ")}
          style={{ width: `${progressRatio * 100}%` }}
        />
      </div>
      {/* Phase dots */}
      <div className="mt-1.5 flex gap-1">
        {(["arrival", "orientation", "deep-work", "collaboration", "expression", "closure"] as const).map((ph) => (
          <div
            key={ph}
            className={[
              "h-1 flex-1 rounded-full",
              ph === state.phase ? "bg-rootwork-teal" : "bg-slate-200",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
