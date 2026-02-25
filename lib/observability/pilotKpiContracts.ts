export type PilotMetricKey =
  | "landing_to_signup_completion_rate"
  | "first_mission_start_rate"
  | "artifact_save_rate"
  | "verification_pass_rate"
  | "teacher_intervention_backlog"
  | "admin_export_readiness_rate";

export type PilotRoleSegment = "student" | "teacher" | "admin";

export type PilotKpiEvent = {
  version: 1;
  eventId: string;
  traceId: string;
  metricKey: PilotMetricKey;
  roleSegment: PilotRoleSegment;
  value: number;
  createdAtIso: string;
  context: {
    missionId?: string;
    learnerId?: string;
    route: string;
    source: "runtime" | "ledger" | "ui" | "api";
  };
};

export type PilotKpiSnapshotItem = {
  metricKey: PilotMetricKey;
  value: number;
  sampleSize: number;
  updatedAtIso: string;
};

export type PilotKpiSnapshot = {
  version: 1;
  window: "24h" | "7d" | "30d";
  generatedAtIso: string;
  items: PilotKpiSnapshotItem[];
};

const METRIC_KEYS: PilotMetricKey[] = [
  "landing_to_signup_completion_rate",
  "first_mission_start_rate",
  "artifact_save_rate",
  "verification_pass_rate",
  "teacher_intervention_backlog",
  "admin_export_readiness_rate"
];

const ROLE_SEGMENTS: PilotRoleSegment[] = ["student", "teacher", "admin"];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIsoTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

export function isPilotMetricKey(value: string): value is PilotMetricKey {
  return METRIC_KEYS.includes(value as PilotMetricKey);
}

export function isPilotRoleSegment(value: string): value is PilotRoleSegment {
  return ROLE_SEGMENTS.includes(value as PilotRoleSegment);
}

export function isPilotKpiEvent(value: unknown): value is PilotKpiEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<PilotKpiEvent>;
  if (event.version !== 1 || !event.eventId || !event.traceId || !event.createdAtIso) {
    return false;
  }

  if (!event.metricKey || !isPilotMetricKey(event.metricKey)) {
    return false;
  }

  if (!event.roleSegment || !isPilotRoleSegment(event.roleSegment)) {
    return false;
  }

  if (!isFiniteNumber(event.value) || !isIsoTimestamp(event.createdAtIso)) {
    return false;
  }

  if (!event.context || typeof event.context !== "object") {
    return false;
  }

  return typeof event.context.route === "string" && typeof event.context.source === "string";
}

export function createEmptyPilotKpiSnapshot(window: PilotKpiSnapshot["window"]): PilotKpiSnapshot {
  const now = new Date().toISOString();
  return {
    version: 1,
    window,
    generatedAtIso: now,
    items: METRIC_KEYS.map((metricKey) => ({
      metricKey,
      value: 0,
      sampleSize: 0,
      updatedAtIso: now
    }))
  };
}
