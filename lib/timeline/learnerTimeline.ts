import type { LedgerRecord } from "@/lib/ledger/adapter";

export type LearnerTimelineEventType = "mission_updated" | "artifact_saved" | "verification_recorded";

export type LearnerTimelineItem = {
  id: string;
  eventType: LearnerTimelineEventType;
  missionId: string;
  occurredAtIso: string;
  summary: string;
};

function isValidIso(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function eventFromRecord(record: LedgerRecord): LearnerTimelineItem | null {
  if (record.type === "mission") {
    const payload = record.payload as { stage?: string; title?: string };
    const stage = payload.stage ?? "unknown";

    return {
      id: record.id,
      eventType: "mission_updated",
      missionId: record.missionId,
      occurredAtIso: record.updatedAtIso,
      summary: `Mission ${payload.title ?? record.missionId} stage is ${stage}.`
    };
  }

  if (record.type === "artifact") {
    const payload = record.payload as { id?: string };

    return {
      id: record.id,
      eventType: "artifact_saved",
      missionId: record.missionId,
      occurredAtIso: record.updatedAtIso,
      summary: `Artifact ${payload.id ?? record.id} saved.`
    };
  }

  if (record.type === "verification") {
    const payload = record.payload as { verdict?: string; standards?: string[] };
    const standardsCount = payload.standards?.length ?? 0;

    return {
      id: record.id,
      eventType: "verification_recorded",
      missionId: record.missionId,
      occurredAtIso: record.updatedAtIso,
      summary: `Verification ${payload.verdict ?? "unknown"} across ${standardsCount} standards.`
    };
  }

  return null;
}

export function buildLearnerTimeline(records: LedgerRecord[], learnerId?: string): LearnerTimelineItem[] {
  const items = records
    .filter((record) => (learnerId ? record.learnerId === learnerId : true))
    .map(eventFromRecord)
    .filter((item): item is LearnerTimelineItem => item !== null)
    .map((item) => ({
      ...item,
      occurredAtIso: isValidIso(item.occurredAtIso) ? new Date(item.occurredAtIso).toISOString() : new Date(0).toISOString()
    }));

  return items.sort((a, b) => {
    if (a.occurredAtIso !== b.occurredAtIso) {
      return b.occurredAtIso.localeCompare(a.occurredAtIso);
    }

    return a.id.localeCompare(b.id);
  });
}
