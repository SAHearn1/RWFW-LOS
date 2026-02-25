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
};

const records = new Map<string, LedgerRecord>();

export const localLedgerAdapter: LedgerAdapter = {
  readAll() {
    return Array.from(records.values());
  },
  upsert(record) {
    records.set(record.id, record);
    return record;
  },
  findByMission(missionId) {
    return Array.from(records.values()).filter((record) => record.missionId === missionId);
  }
};
