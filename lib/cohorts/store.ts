import type { CohortRecord } from "./types";

const COHORTS_KEY = "rootwork.cohorts";

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

export function readAllCohorts(): CohortRecord[] {
  return loadFromStorage<CohortRecord>(COHORTS_KEY);
}

export function upsertCohort(cohort: CohortRecord): void {
  const all = readAllCohorts();
  const idx = all.findIndex((c) => c.id === cohort.id);
  if (idx === -1) {
    all.push(cohort);
  } else {
    all[idx] = cohort;
  }
  saveToStorage(COHORTS_KEY, all);
}

export function deleteCohort(id: string): void {
  const all = readAllCohorts().filter((c) => c.id !== id);
  saveToStorage(COHORTS_KEY, all);
}

export function createCohort(name: string): CohortRecord {
  const cohort: CohortRecord = {
    id: `cohort_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    status: "active",
    learnerIds: [],
    createdAtIso: new Date().toISOString(),
  };
  upsertCohort(cohort);
  return cohort;
}
