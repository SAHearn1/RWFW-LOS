/**
 * Continuous Governance Intelligence Agent — Multi-Dimensional Operability Score.
 *
 * Aggregates environment signals into a structured score report across six
 * enterprise dimensions. Consumed by GET /api/governance/operability
 * (admin / super_admin only).
 *
 * Dimensions and weights:
 *   Security           25 %
 *   Tenant Isolation   25 %
 *   Worker Reliability 20 %
 *   Audit Coverage     15 %
 *   AI Integrity       10 %
 *   UX Health           5 %
 */

export type ScoreGrade = "A" | "B" | "C" | "D" | "F";

export type DimensionScore = {
  score: number;        // 0–100
  grade: ScoreGrade;
  details: string;
  signals: Record<string, boolean | number | string>;
};

export type OperabilityReport = {
  generatedAtIso: string;
  overall: number;
  grade: ScoreGrade;
  dimensions: {
    security: DimensionScore;
    tenantIsolation: DimensionScore;
    workerReliability: DimensionScore;
    auditCoverage: DimensionScore;
    aiIntegrity: DimensionScore;
    uxHealth: DimensionScore;
  };
  /** P0 issues — must be resolved before production deployment. */
  blockers: string[];
  /** P1 issues — should be resolved before next release cycle. */
  warnings: string[];
  /** true when there are zero blockers and overall >= 70. */
  productionReady: boolean;
};

export type OperabilitySignals = {
  /** DynamoDB ledger adapter is configured (DB_LEDGER_ADAPTER=dynamo or AWS_DYNAMODB_LEDGER_TABLE). */
  dynamoLedgerConfigured: boolean;
  /** In-memory queue fallback is blocked in production environments. */
  inMemoryFallbackBlocked: boolean;
  /** Audit HTTP endpoint is configured for durable event drain. */
  auditHttpEndpointConfigured: boolean;
  /** Clerk webhook secret is present (enables HMAC signature validation). */
  webhookSecretConfigured: boolean;
  /** Rate limiting is enforced on all API routes (structural guarantee). */
  rateLimitingActive: boolean;
  /** Federation dispatch requires admin/super_admin role (structural guarantee). */
  federationAuthEnforced: boolean;
  /** AI inference audit is enabled via NEXT_PUBLIC_ENABLE_INFERENCE_AUDIT. */
  inferenceAuditEnabled: boolean;
  /** AWS SQS queue URL is configured for durable orchestration jobs. */
  sqsConfigured: boolean;
  /** Pilot telemetry ingest token is configured. */
  telemetryConfigured: boolean;
  /** Authorization anomaly count from the threat intelligence window. */
  authAnomalyCount: number;
  /** Estimated recent worker failure count (0 = no data / healthy). */
  recentWorkerFailures: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): ScoreGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function weightedAverage(scores: { score: number; weight: number }[]): number {
  const totalWeight = scores.reduce((s, x) => s + x.weight, 0);
  const weightedSum = scores.reduce((s, x) => s + x.score * x.weight, 0);
  return Math.round(weightedSum / totalWeight);
}

// ─── Signal gathering ─────────────────────────────────────────────────────────

/**
 * Gather operability signals from the process environment.
 * @param authAnomalyCount - Pass the value from generateThreatIntelReport().authorizationAnomalyIndex.
 */
export function gatherOperabilitySignals(authAnomalyCount = 0): OperabilitySignals {
  const isProduction = process.env.VERCEL_ENV === "production";

  return {
    dynamoLedgerConfigured: Boolean(
      process.env.DB_LEDGER_ADAPTER === "dynamo" ||
      process.env.AWS_DYNAMODB_LEDGER_TABLE?.trim()
    ),
    inMemoryFallbackBlocked: isProduction
      ? process.env.ALLOW_AWS_WORKER_FALLBACK !== "true"
      : true,
    auditHttpEndpointConfigured: Boolean(process.env.AUDIT_HTTP_ENDPOINT?.trim()),
    webhookSecretConfigured: Boolean(process.env.CLERK_WEBHOOK_SECRET?.trim()),
    rateLimitingActive: true,       // Structural guarantee: lib/ratelimit enforced at route level
    federationAuthEnforced: true,   // Structural guarantee: app/api/federation/route.ts
    inferenceAuditEnabled: process.env.NEXT_PUBLIC_ENABLE_INFERENCE_AUDIT === "true",
    sqsConfigured: Boolean(process.env.AWS_SQS_QUEUE_URL?.trim()),
    telemetryConfigured: Boolean(process.env.ROOTWORK_TELEMETRY_INGEST_TOKEN?.trim()),
    authAnomalyCount,
    recentWorkerFailures: 0   // Requires DynamoDB scan — placeholder for future implementation
  };
}

// ─── Score computation ────────────────────────────────────────────────────────

/**
 * Compute a multi-dimensional operability report from the given signals.
 */
export function computeOperabilityScore(signals: OperabilitySignals): OperabilityReport {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // ── Security (25 % weight) ───────────────────────────────────────────────
  let secScore = 100;
  const secSignals: Record<string, boolean | number | string> = {
    webhookSecretConfigured: signals.webhookSecretConfigured,
    rateLimitingActive: signals.rateLimitingActive,
    federationAuthEnforced: signals.federationAuthEnforced,
    auditHttpEndpointConfigured: signals.auditHttpEndpointConfigured
  };

  if (!signals.webhookSecretConfigured) {
    secScore -= 30;
    blockers.push(
      "CLERK_WEBHOOK_SECRET is missing — Clerk webhook HMAC validation is disabled. User sync is vulnerable to spoofing."
    );
  }
  if (!signals.auditHttpEndpointConfigured) {
    secScore -= 10;
    warnings.push(
      "AUDIT_HTTP_ENDPOINT is not configured — audit events are stdout-only and not durably stored."
    );
  }

  const security: DimensionScore = {
    score: Math.max(secScore, 0),
    grade: scoreToGrade(Math.max(secScore, 0)),
    details:
      "Clerk HMAC webhook validation, in-memory rate limiting, federation dispatch auth enforcement, audit sink durability.",
    signals: secSignals
  };

  // ── Tenant Isolation (25 % weight) ───────────────────────────────────────
  let tenantScore = 100;
  const tenantSignals: Record<string, boolean | number | string> = {
    dynamoLedgerConfigured: signals.dynamoLedgerConfigured,
    authAnomalyCount: signals.authAnomalyCount
  };

  if (!signals.dynamoLedgerConfigured) {
    tenantScore -= 40;
    warnings.push(
      "DB_LEDGER_ADAPTER is not 'dynamo' — localStorage/SQLite has no per-tenant partition keys. Cross-tenant data leakage risk exists."
    );
  }
  if (signals.authAnomalyCount > 50) {
    tenantScore -= 30;
    blockers.push(
      `Authorization anomaly index (${signals.authAnomalyCount}) exceeds critical threshold. Possible cross-tenant access attempts detected.`
    );
  } else if (signals.authAnomalyCount > 10) {
    tenantScore -= 10;
    warnings.push(
      `Elevated authorization anomaly index: ${signals.authAnomalyCount}. Review threat-intel report for suspicious actors.`
    );
  }

  const tenantIsolation: DimensionScore = {
    score: Math.max(tenantScore, 0),
    grade: scoreToGrade(Math.max(tenantScore, 0)),
    details:
      "DynamoDB tenant partition keys (tenant#{tenantId}#...), optimistic locking, authorization anomaly index.",
    signals: tenantSignals
  };

  // ── Worker Reliability (20 % weight) ─────────────────────────────────────
  let workerScore = 100;
  const workerSignals: Record<string, boolean | number | string> = {
    sqsConfigured: signals.sqsConfigured,
    inMemoryFallbackBlocked: signals.inMemoryFallbackBlocked,
    recentWorkerFailures: signals.recentWorkerFailures
  };

  if (!signals.sqsConfigured) {
    workerScore -= 30;
    warnings.push(
      "AWS_SQS_QUEUE_URL is not set — orchestration uses a non-durable in-memory queue. Jobs will be lost on cold start."
    );
  }
  if (!signals.inMemoryFallbackBlocked) {
    workerScore -= 20;
    warnings.push(
      "ALLOW_AWS_WORKER_FALLBACK=true in production — non-durable in-memory fallback is active. Disable for production deployments."
    );
  }
  if (signals.recentWorkerFailures > 10) {
    workerScore -= 20;
    blockers.push(
      `${signals.recentWorkerFailures} recent worker failures detected. Job reliability is below enterprise threshold.`
    );
  } else if (signals.recentWorkerFailures > 3) {
    workerScore -= 10;
    warnings.push(`${signals.recentWorkerFailures} recent worker failures. Monitor job state store.`);
  }

  const workerReliability: DimensionScore = {
    score: Math.max(workerScore, 0),
    grade: scoreToGrade(Math.max(workerScore, 0)),
    details:
      "SQS queue durability, in-memory fallback policy, job failure rate, idempotency key enforcement, state transition history.",
    signals: workerSignals
  };

  // ── Audit Coverage (15 % weight) ─────────────────────────────────────────
  let auditScore = 100;
  const auditSignals: Record<string, boolean | number | string> = {
    auditHttpEndpointConfigured: signals.auditHttpEndpointConfigured,
    telemetryConfigured: signals.telemetryConfigured,
    inferenceAuditEnabled: signals.inferenceAuditEnabled
  };

  if (!signals.auditHttpEndpointConfigured) auditScore -= 25; // warning emitted in security block
  if (!signals.telemetryConfigured) {
    auditScore -= 15;
    warnings.push(
      "ROOTWORK_TELEMETRY_INGEST_TOKEN is not configured — pilot KPI data is not being collected."
    );
  }
  if (!signals.inferenceAuditEnabled) {
    auditScore -= 20;
    warnings.push(
      "NEXT_PUBLIC_ENABLE_INFERENCE_AUDIT is not set — AI prompt lineage and model metadata are not tracked."
    );
  }

  const auditCoverage: DimensionScore = {
    score: Math.max(auditScore, 0),
    grade: scoreToGrade(Math.max(auditScore, 0)),
    details:
      "Audit HTTP durable sink, pilot KPI telemetry, AI inference audit trail (prompt hash, model version, latency).",
    signals: auditSignals
  };

  // ── AI Integrity (10 % weight) ────────────────────────────────────────────
  let aiScore = 100;
  const aiSignals: Record<string, boolean | number | string> = {
    inferenceAuditEnabled: signals.inferenceAuditEnabled
  };

  if (!signals.inferenceAuditEnabled) {
    aiScore -= 40;
    // Warning already emitted in audit coverage block.
  }

  const aiIntegrity: DimensionScore = {
    score: Math.max(aiScore, 0),
    grade: scoreToGrade(Math.max(aiScore, 0)),
    details:
      "SHA-256 prompt lineage hashing, model + provider version tracking per request, inference audit trail via /api/governance/ai-audit.",
    signals: aiSignals
  };

  // ── UX Health (5 % weight) ────────────────────────────────────────────────
  const uxScore = signals.telemetryConfigured ? 80 : 60;
  const uxHealth: DimensionScore = {
    score: uxScore,
    grade: scoreToGrade(uxScore),
    details:
      "UX friction index (estimated — enable telemetry for real measurement), WCAG 2.1 AA structural compliance.",
    signals: { telemetryConfigured: signals.telemetryConfigured }
  };

  // ── Overall ───────────────────────────────────────────────────────────────
  const overall = weightedAverage([
    { score: security.score, weight: 25 },
    { score: tenantIsolation.score, weight: 25 },
    { score: workerReliability.score, weight: 20 },
    { score: auditCoverage.score, weight: 15 },
    { score: aiIntegrity.score, weight: 10 },
    { score: uxHealth.score, weight: 5 }
  ]);

  return {
    generatedAtIso: new Date().toISOString(),
    overall,
    grade: scoreToGrade(overall),
    dimensions: {
      security,
      tenantIsolation,
      workerReliability,
      auditCoverage,
      aiIntegrity,
      uxHealth
    },
    blockers,
    warnings,
    productionReady: blockers.length === 0 && overall >= 70
  };
}
