import type { RuntimeArtifact, RuntimeMission, VerificationEvent } from "@/lib/runtime/contracts/types";
import { decryptFromStorage, encryptForStorage } from "@/lib/crypto/localStorageEncryption";

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

// In-memory cache that is always authoritative for synchronous reads.
// Populated from localStorage (with decryption) on first access.
let memoryCache: LedgerRecord[] | null = null;
let cacheLoadInitiated = false;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Initiates an async load from localStorage into memoryCache (runs once).
 * Callers that need fresh data should trigger this and re-read after the
 * promise resolves, but synchronous callers use ledgerFallback / memoryCache.
 */
async function initCacheFromStorage(): Promise<void> {
  if (!canUseLocalStorage()) return;
  const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
  if (!raw) {
    memoryCache = [];
    return;
  }
  try {
    const decrypted = await decryptFromStorage(raw);
    memoryCache = JSON.parse(decrypted) as LedgerRecord[];
  } catch {
    memoryCache = [];
  }
}

function ensureCacheLoaded(): void {
  if (!cacheLoadInitiated) {
    cacheLoadInitiated = true;
    void initCacheFromStorage();
  }
}

function readRecords(): LedgerRecord[] {
  if (!canUseLocalStorage()) {
    return ledgerFallback;
  }
  ensureCacheLoaded();
  return memoryCache ?? [];
}

function writeRecords(records: LedgerRecord[]): LedgerRecord[] {
  if (!canUseLocalStorage()) {
    ledgerFallback = records;
    return records;
  }

  // Update the in-memory cache synchronously so subsequent reads see the new data.
  memoryCache = records;

  // Persist to localStorage asynchronously with encryption (fire-and-forget).
  const serialized = JSON.stringify(records);
  encryptForStorage(serialized)
    .then((stored) => {
      window.localStorage.setItem(LEDGER_STORAGE_KEY, stored);
    })
    .catch(() => {
      // Encryption or storage failure — in-memory cache remains authoritative.
    });

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
