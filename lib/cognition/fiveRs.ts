// Migrated from src/constants.ts — do NOT import from src/ in lib/.

export type FiveRStep = "root" | "regulate" | "reflect" | "restore" | "reconnect";

export type FiveRStepConfig = {
  label: string;
  description: string;
  prompt: string;
};

export const FIVE_RS: Record<FiveRStep, FiveRStepConfig> = {
  root: {
    label: "Root",
    description: "Identity/context grounding",
    prompt: "What do you know about this topic? What's your connection to it?",
  },
  regulate: {
    label: "Regulate",
    description: "Readiness activation",
    prompt: "How are you feeling right now? What do you need to be ready to learn?",
  },
  reflect: {
    label: "Reflect",
    description: "Metacognition",
    prompt: "What did you discover? What surprised you? What do you still wonder about?",
  },
  restore: {
    label: "Restore",
    description: "Correction/revision",
    prompt: "What would you change or improve? What did you learn from mistakes?",
  },
  reconnect: {
    label: "Reconnect",
    description: "Application/community",
    prompt: "How does this connect to your world? Who else might benefit from what you learned?",
  },
} as const;

export const FIVE_RS_ORDERED: readonly FiveRStep[] = [
  "root",
  "regulate",
  "reflect",
  "restore",
  "reconnect",
] as const;
