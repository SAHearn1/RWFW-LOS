import type { ReviewRecord, ReviewVerdict } from "./types";

const VERDICTS_KEY = "rootwork.reviews.verdicts";

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage unavailable — degrade silently
  }
}

export function readAllVerdicts(): ReviewRecord[] {
  return loadFromStorage<ReviewRecord>(VERDICTS_KEY);
}

export function saveVerdict(artifactId: string, verdict: ReviewVerdict): void {
  const all = readAllVerdicts();
  const idx = all.findIndex((r) => r.artifactId === artifactId);
  const now = new Date().toISOString();
  if (idx === -1) {
    // Create a minimal record if one doesn't exist yet
    const record: ReviewRecord = {
      id: `verdict_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      artifactId,
      learnerId: "",
      missionId: "",
      contentPreview: "",
      savedAtIso: now,
      verdict,
      reviewedAtIso: now,
    };
    all.push(record);
  } else {
    all[idx] = { ...all[idx], verdict, reviewedAtIso: now };
  }
  saveToStorage(VERDICTS_KEY, all);
}

export function getVerdict(artifactId: string): ReviewVerdict | null {
  const record = readAllVerdicts().find((r) => r.artifactId === artifactId);
  return record?.verdict ?? null;
}
