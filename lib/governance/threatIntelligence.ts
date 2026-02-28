/**
 * Security & Threat Intelligence Agent — Authorization Anomaly Index.
 *
 * Tracks authorization denial events in a process-scoped rolling window.
 * Provides risk scoring and anomaly pattern detection for the governance
 * dashboard at GET /api/governance/threat-intel (super_admin only).
 *
 * Storage: in-memory (resets on serverless cold start). Configure
 * AUDIT_HTTP_ENDPOINT to drain events to a durable sink.
 */

export type DenialEvent = {
  eventId: string;
  userId: string;
  route: string;
  role: string;
  reason: string;
  traceId: string;
  occurredAtIso: string;
};

export type UserRiskProfile = {
  userId: string;
  totalDenials: number;
  uniqueRoutes: number;
  lastDenialIso: string;
  /** Risk score: 0 (no risk) – 100 (critical). */
  riskScore: number;
  /** true when denials exceed the escalation threshold. */
  escalated: boolean;
};

export type ThreatIntelReport = {
  generatedAtIso: string;
  windowStartIso: string | null;
  windowEndIso: string | null;
  totalDenials: number;
  uniqueActors: number;
  topDeniedRoutes: { route: string; count: number }[];
  highRiskUsers: UserRiskProfile[];
  /**
   * 0 = no anomalies, 100 = critical anomaly load.
   * Scaled linearly: every 5 denials in the window = +1 point (capped at 100).
   */
  authorizationAnomalyIndex: number;
};

// ─── In-memory rolling window ────────────────────────────────────────────────

const DENIAL_STORE: DenialEvent[] = [];
const MAX_STORE_SIZE = 10_000;
const ESCALATION_THRESHOLD = 10;
const HIGH_RISK_THRESHOLD = 70;

let eventCounter = 0;

function generateEventId(): string {
  return `denial.${Date.now()}.${(eventCounter++).toString(36)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record an authorization denial event.
 * Called automatically from authorize() in lib/auth/authorize.ts.
 */
export function recordDenialEvent(event: Omit<DenialEvent, "eventId">): void {
  if (DENIAL_STORE.length >= MAX_STORE_SIZE) {
    // Evict oldest 20 % to bound memory growth on warm Vercel instances.
    DENIAL_STORE.splice(0, Math.floor(MAX_STORE_SIZE * 0.2));
  }
  DENIAL_STORE.push({ ...event, eventId: generateEventId() });
}

/**
 * Get denial events from the rolling window.
 * @param sinceIso - ISO timestamp; omit for a default 24-hour window.
 */
export function getDenialEvents(sinceIso?: string): DenialEvent[] {
  const since = sinceIso
    ? new Date(sinceIso).getTime()
    : Date.now() - 24 * 60 * 60 * 1_000;

  return DENIAL_STORE.filter(
    (d) => new Date(d.occurredAtIso).getTime() >= since
  );
}

// ─── Risk scoring ─────────────────────────────────────────────────────────────

/**
 * Compute a risk score (0–100) for a user based on their denial history.
 *
 * Scoring components:
 *   - Volume:    min(denials × 5, 60)
 *   - Diversity: min(uniqueRoutes × 8, 30)  — many routes = lateral movement
 *   - Recency:   min(last-5min denials × 3, 10)
 */
function computeUserRiskScore(userDenials: DenialEvent[]): number {
  if (userDenials.length === 0) return 0;

  const volumeScore = Math.min(userDenials.length * 5, 60);
  const diversityScore = Math.min(
    new Set(userDenials.map((d) => d.route)).size * 8,
    30
  );

  const now = Date.now();
  const recentCount = userDenials.filter(
    (d) => now - new Date(d.occurredAtIso).getTime() < 5 * 60 * 1_000
  ).length;
  const recencyScore = Math.min(recentCount * 3, 10);

  return Math.min(volumeScore + diversityScore + recencyScore, 100);
}

// ─── Report generation ────────────────────────────────────────────────────────

/**
 * Generate a full threat intelligence report from the rolling window.
 * @param sinceIso - ISO timestamp; omit for default 24-hour window.
 */
export function generateThreatIntelReport(
  sinceIso?: string
): ThreatIntelReport {
  const events = getDenialEvents(sinceIso);
  const now = new Date().toISOString();

  if (events.length === 0) {
    return {
      generatedAtIso: now,
      windowStartIso: null,
      windowEndIso: null,
      totalDenials: 0,
      uniqueActors: 0,
      topDeniedRoutes: [],
      highRiskUsers: [],
      authorizationAnomalyIndex: 0
    };
  }

  // Group by user
  const byUser = new Map<string, DenialEvent[]>();
  for (const event of events) {
    const list = byUser.get(event.userId) ?? [];
    list.push(event);
    byUser.set(event.userId, list);
  }

  // Top denied routes
  const routeCounts = new Map<string, number>();
  for (const event of events) {
    routeCounts.set(event.route, (routeCounts.get(event.route) ?? 0) + 1);
  }
  const topDeniedRoutes = [...routeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  // User risk profiles
  const userProfiles: UserRiskProfile[] = [];
  for (const [userId, userDenials] of byUser) {
    const sorted = [...userDenials].sort(
      (a, b) =>
        new Date(b.occurredAtIso).getTime() -
        new Date(a.occurredAtIso).getTime()
    );
    const riskScore = computeUserRiskScore(userDenials);
    userProfiles.push({
      userId,
      totalDenials: userDenials.length,
      uniqueRoutes: new Set(userDenials.map((d) => d.route)).size,
      lastDenialIso: sorted[0].occurredAtIso,
      riskScore,
      escalated: userDenials.length >= ESCALATION_THRESHOLD
    });
  }

  const highRiskUsers = userProfiles
    .filter((p) => p.riskScore >= HIGH_RISK_THRESHOLD)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 20);

  // Anomaly index: every 5 denials = +1 point, capped at 100
  const anomalyIndex = Math.min(Math.floor(events.length / 5), 100);

  const chronological = [...events].sort(
    (a, b) =>
      new Date(a.occurredAtIso).getTime() -
      new Date(b.occurredAtIso).getTime()
  );

  return {
    generatedAtIso: now,
    windowStartIso: chronological[0].occurredAtIso,
    windowEndIso: chronological[chronological.length - 1].occurredAtIso,
    totalDenials: events.length,
    uniqueActors: byUser.size,
    topDeniedRoutes,
    highRiskUsers,
    authorizationAnomalyIndex: anomalyIndex
  };
}
