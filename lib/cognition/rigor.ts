// Migrated from src/constants.ts — do NOT import from src/ in lib/.

export type RigorLayer =
  | "concept-access"
  | "applied-practice"
  | "analytical-challenge"
  | "system-design"
  | "public-expression"
  | "transfer-task";

export const RIGOR_LAYERS_ORDERED: readonly RigorLayer[] = [
  "concept-access",
  "applied-practice",
  "analytical-challenge",
  "system-design",
  "public-expression",
  "transfer-task",
] as const;

export const RIGOR_LAYER_LABELS: Record<RigorLayer, string> = {
  "concept-access": "Concept Access",
  "applied-practice": "Applied Practice",
  "analytical-challenge": "Analytical Challenge",
  "system-design": "System Design",
  "public-expression": "Public Expression",
  "transfer-task": "Transfer Task",
};

export type ArtifactModality = "voice" | "sketch" | "photo" | "model" | "text" | "upload";
