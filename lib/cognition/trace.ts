// Migrated from src/constants.ts — do NOT import from src/ in lib/.

export type TraceStep = "trigger" | "regulate" | "attend" | "construct" | "express";

export type TracePhaseConfig = {
  label: string;
  behavior: string;
  stimulus: "full" | "reduced" | "isolated" | "expanded" | "presentation";
  motion: "still" | "breathing" | "expanding" | "growing";
  focusSuppression: boolean;
};

export const TRACE_PHASES: Record<TraceStep, TracePhaseConfig> = {
  trigger: {
    label: "Trigger",
    behavior: "Orientation + context",
    stimulus: "full",
    motion: "still",
    focusSuppression: false,
  },
  regulate: {
    label: "Regulate",
    behavior: "Reduced stimulus + grounding",
    stimulus: "reduced",
    motion: "breathing",
    focusSuppression: true,
  },
  attend: {
    label: "Attend",
    behavior: "Focus isolation",
    stimulus: "isolated",
    motion: "expanding",
    focusSuppression: true,
  },
  construct: {
    label: "Construct",
    behavior: "Tool expansion",
    stimulus: "expanded",
    motion: "growing",
    focusSuppression: false,
  },
  express: {
    label: "Express",
    behavior: "Presentation environment",
    stimulus: "presentation",
    motion: "still",
    focusSuppression: false,
  },
} as const;

export const TRACE_STEPS_ORDERED: readonly TraceStep[] = [
  "trigger",
  "regulate",
  "attend",
  "construct",
  "express",
] as const;
