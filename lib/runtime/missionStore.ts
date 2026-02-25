// Singleton in-memory store for missions — trial-grade persistence.
// Data lives for the lifetime of the server process.
// Production: replace with Vercel KV or DB.

export interface MissionRecord {
  id: string;
  learnerId: string;
  title: string;
  stage: "not_started" | "in_progress" | "submitted" | "verified";
  createdAtIso: string;
  updatedAtIso: string;
}

// In-memory store (singleton)
const store: MissionRecord[] = [];

export function listMissions(learnerId?: string): MissionRecord[] {
  if (learnerId) return store.filter(m => m.learnerId === learnerId);
  return [...store];
}

export function createMission(learnerId: string, title: string): MissionRecord {
  const record: MissionRecord = {
    id: `mission_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    learnerId,
    title,
    stage: "not_started",
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  };
  store.push(record);
  return record;
}

export function deleteMission(id: string): boolean {
  const idx = store.findIndex(m => m.id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}
