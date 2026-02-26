// Migrated from src/constants.ts — do NOT import from src/ in lib/.

export type HumanState =
  | "focused"
  | "distracted"
  | "fatigued"
  | "curious"
  | "stalled"
  | "overloaded"
  | "drifting";

export type CognitiveState = "focused" | "tired" | "distracted" | "stressed" | "ready";

export type LearnerState = {
  attentionStability: number; // 0–1
  cognitiveLoad: number; // 0–1
  productiveStruggle: boolean;
  regulationStatus: "stable" | "fragile" | "disrupted";
  engagementTrend: "rising" | "stable" | "falling";
  lastUpdate: number; // Unix timestamp ms
};

export const DEFAULT_LEARNER_STATE: LearnerState = {
  attentionStability: 0.8,
  cognitiveLoad: 0.3,
  productiveStruggle: false,
  regulationStatus: "stable",
  engagementTrend: "stable",
  lastUpdate: 0,
};
