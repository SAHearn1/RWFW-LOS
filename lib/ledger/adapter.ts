import type { RuntimeArtifact, RuntimeMission, VerificationEvent } from "@/lib/runtime/contracts/types";

export type LedgerRecordType = "mission" | "artifact" | "verification" | "reflection";

export type DataTier = "tier-0" | "tier-1" | "tier-2" | "tier-3";

export type LedgerRecord = {
  id: string;
  type: LedgerRecordType;
  missionId: string;
  learnerId: string;
  payload: RuntimeMission | RuntimeArtifact | VerificationEvent | Record<string, unknown>;
  createdAtIso: string;
  updatedAtIso: string;
  // Pedagogical enrichment fields (all optional — backward compatible)
  competencies?: string[];
  rigorLevel?: number;       // 1–6, matching RigorLayer index
  verifiedBy?: string;       // educator Clerk userId
  verificationMethod?: "performance" | "analytical" | "applied" | "transfer";
  revisionHistory?: string[];
  reflectionId?: string;     // links artifact to a reflection record
  dataTier?: DataTier;       // FERPA data classification (ticket #240)
};

export type LedgerAdapter = {
  readAll: () => LedgerRecord[];
  upsert: (record: LedgerRecord) => LedgerRecord;
  findByMission: (missionId: string) => LedgerRecord[];
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
    return [];
  }
}

function writeRecords(records: LedgerRecord[]): LedgerRecord[] {
  if (!canUseLocalStorage()) {
    ledgerFallback = records;
    return records;
  }

  window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(records));
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

function inferDataTier(type: LedgerRecordType): DataTier {
  switch (type) {
    case "verification": return "tier-0";
    case "artifact": return "tier-1";
    case "mission": return "tier-1";
    case "reflection": return "tier-3";
    default: return "tier-1";
  }
}

export const localLedgerAdapter: LedgerAdapter = {
  readAll() {
    return readRecords();
  },
  upsert(record) {
    // Auto-classify dataTier if not explicitly set (#240 FERPA classification)
    const withTier: LedgerRecord = {
      ...record,
      dataTier: record.dataTier ?? inferDataTier(record.type),
    };
    const records = readRecords();
    const next = records.filter((item) => item.id !== record.id);
    next.push(withTier);
    writeRecords(next);
    return withTier;
  },
  findByMission(missionId) {
    return readRecords().filter((record) => record.missionId === missionId);
  },
};
