// Migrated from src/constants.ts — do NOT import from src/ in lib/.

export type SessionPhase =
  | "arrival"
  | "orientation"
  | "deep-work"
  | "collaboration"
  | "expression"
  | "closure";

export type SessionPhaseConfig = {
  label: string;
  duration: number; // minutes
  description: string;
};

export const SESSION_PHASES: Record<SessionPhase, SessionPhaseConfig> = {
  arrival: { label: "Arrival", duration: 3, description: "Stabilize nervous system" },
  orientation: { label: "Orientation", duration: 7, description: "Mission preview" },
  "deep-work": { label: "Deep Work", duration: 25, description: "Protected thinking time" },
  collaboration: { label: "Collaboration", duration: 10, description: "Social cognition" },
  expression: { label: "Expression", duration: 10, description: "Knowledge production" },
  closure: { label: "Closure", duration: 5, description: "Progress integration" },
} as const;

export const SESSION_PHASES_ORDERED: readonly SessionPhase[] = [
  "arrival",
  "orientation",
  "deep-work",
  "collaboration",
  "expression",
  "closure",
] as const;

export const TOTAL_SESSION_MINUTES = SESSION_PHASES_ORDERED.reduce(
  (sum, phase) => sum + SESSION_PHASES[phase].duration,
  0
);
