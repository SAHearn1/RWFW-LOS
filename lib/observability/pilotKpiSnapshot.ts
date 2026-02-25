import type { LedgerRecord } from "@/lib/ledger/adapter";
import type { RuntimeState } from "@/lib/runtime/engine/reducer";

import { createEmptyPilotKpiSnapshot, type PilotKpiSnapshot } from "@/lib/observability/pilotKpiContracts";

function toPercent(value: number): number {
  return Number.isFinite(value) ? Number(Math.max(0, Math.min(100, value)).toFixed(2)) : 0;
}

export function createPilotSnapshotFromLocalState(runtime: RuntimeState, records: LedgerRecord[]): PilotKpiSnapshot {
  const snapshot = createEmptyPilotKpiSnapshot("7d");

  const missionCount = Object.keys(runtime.missions).length;
  const artifactCount = records.filter((record) => record.type === "artifact").length;
  const verificationRecords = records.filter((record) => record.type === "verification");

  const passCount = verificationRecords.filter((record) => {
    const payload = record.payload as { verdict?: string };
    return payload.verdict === "pass";
  }).length;

  const values = {
    landing_to_signup_completion_rate: missionCount > 0 ? 100 : 0,
    first_mission_start_rate: missionCount > 0 ? 100 : 0,
    artifact_save_rate: missionCount > 0 ? toPercent((artifactCount / missionCount) * 100) : 0,
    verification_pass_rate: verificationRecords.length > 0 ? toPercent((passCount / verificationRecords.length) * 100) : 0,
    teacher_intervention_backlog: 0,
    admin_export_readiness_rate: missionCount > 0 && artifactCount > 0 ? 100 : 0
  } as const;

  snapshot.items = snapshot.items.map((item) => ({
    ...item,
    value: values[item.metricKey],
    sampleSize: item.metricKey === "verification_pass_rate"
      ? verificationRecords.length
      : item.metricKey === "artifact_save_rate"
        ? missionCount
        : missionCount,
    updatedAtIso: snapshot.generatedAtIso
  }));

  return snapshot;
}
