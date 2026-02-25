export type ReviewVerdict = "approved" | "returned" | "flagged";

export interface ReviewRecord {
  id: string;
  artifactId: string;
  learnerId: string;
  missionId: string;
  contentPreview: string;
  savedAtIso: string;
  verdict: ReviewVerdict | null;
  reviewedAtIso: string | null;
}
