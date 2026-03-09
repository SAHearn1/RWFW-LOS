import type { RuntimeArtifact, RuntimeMission, VerificationEvent } from "@/lib/runtime/contracts/types";

export type LedgerRecordType = "mission" | "artifact" | "verification";

export type LedgerRecord = {
  id: string;
  type: LedgerRecordType;
  missionId: string;
  learnerId: string;
  payload: RuntimeMission | RuntimeArtifact | VerificationEvent;
  createdAtIso: string;
  updatedAtIso: string;
};

export type LedgerAdapter = {
  readAll: () => LedgerRecord[];
  upsert: (record: LedgerRecord) => LedgerRecord;
  findByMission: (missionId: string) => LedgerRecord[];
  findByLearner: (learnerId: string) => LedgerRecord[];
};

const LEDGER_STORAGE_KEY = "rootwork.ledger.records";
let ledgerFallback: LedgerRecord[] = [];

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRecords(): LedgerRecord[] {
  if (!canUseLocalStorage()) {
    return ledgerFallback;
  }

  const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as LedgerRecord[];
  } catch {
    console.warn("[ledger/adapter] readRecords: failed to parse stored ledger — returning empty. Data may be corrupted.");
    return [];
  }
}

function writeRecords(records: LedgerRecord[]): LedgerRecord[] {
  if (!canUseLocalStorage()) {
    ledgerFallback = records;
    return records;
  }

  try {
    window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(records));
  } catch {
    console.warn("[ledger/adapter] writeRecords: localStorage quota exceeded — ledger write skipped.");
  }
  return records;
}

export function purgeLedgerRecordsBefore(cutoffIso: string): number {
  const records = readRecords();
  const kept = records.filter((record) => record.updatedAtIso >= cutoffIso);
  writeRecords(kept);
  return records.length - kept.length;
}

export function deleteLedgerRecordsByLearner(learnerId: string): number {
  const records = readRecords();
  const kept = records.filter((record) => record.learnerId !== learnerId);
  writeRecords(kept);
  return records.length - kept.length;
}

export const localLedgerAdapter: LedgerAdapter = {
  readAll() {
    return readRecords();
  },
  upsert(record) {
    const records = readRecords();
    const next = records.filter((item) => item.id !== record.id);
    next.push(record);
    writeRecords(next);
    return record;
  },
  findByMission(missionId) {
    return readRecords().filter((record) => record.missionId === missionId);
  },
  findByLearner(learnerId) {
    return readRecords().filter((record) => record.learnerId === learnerId);
  }
};
