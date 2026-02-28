/**
 * AI Governance & Model Integrity Agent — Inference Audit Trail.
 *
 * Records prompt lineage, model metadata, and usage patterns for every AI
 * inference request processed by /api/inference. Outputs to the structured
 * audit log (stdout + optional HTTP sink) and maintains an in-memory rolling
 * window for dashboard queries via /api/governance/ai-audit.
 *
 * Privacy design:
 *   - Raw prompts are NEVER stored.
 *   - Only a SHA-256 hash prefix (16 hex chars) is recorded for drift detection.
 *   - Prompt length is stored for size-trend analysis.
 */

import { createHash } from "node:crypto";

import { recordAuditEvent } from "@/lib/observability/audit";
import type { ModelProviderName } from "@/lib/llm/providerContracts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InferenceAuditEvent = {
  /** Trace/request ID for correlation across logs */
  requestId: string;
  /** Model identifier (e.g. "llama3.1:8b", "amazon.titan-text-express-v1") */
  model: string;
  /** Provider that handled the inference */
  provider: ModelProviderName;
  /** First 16 hex chars of SHA-256(prompt) — for prompt drift detection */
  promptHash: string;
  /** Prompt character length — for input size trend analysis */
  promptLength: number;
  /** User role at inference time */
  role: string;
  /** Clerk user ID */
  userId: string;
  /** Organization ID if available */
  orgId?: string;
  /** Privacy mode used for this request */
  privacyMode: string;
  /** Temperature setting (undefined = provider default) */
  temperature?: number;
  /** Max tokens limit applied */
  maxTokens?: number;
  /** Whether inference fell back to an alternate provider */
  usedFallback: boolean;
  /** Rough output token estimate: ceil(outputText.length / 4) */
  outputTokenEstimate: number;
  /** End-to-end inference latency in milliseconds */
  latencyMs: number;
  /** ISO timestamp of the inference event */
  createdAtIso: string;
};

export type InferenceAuditSummary = {
  totalInferences: number;
  uniqueUsers: number;
  modelUsage: Record<string, number>;
  providerUsage: Record<string, number>;
  fallbackRate: number;
  avgLatencyMs: number;
  avgOutputTokens: number;
  windowStartIso: string | null;
  windowEndIso: string | null;
};

// ─── Rolling window ───────────────────────────────────────────────────────────

const INFERENCE_STORE: InferenceAuditEvent[] = [];
const MAX_MEMORY_EVENTS = 1_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}

function estimateTokens(text: string): number {
  // 1 token ≈ 4 characters (industry-standard rough estimate)
  return Math.ceil(text.length / 4);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build an InferenceAuditEvent from raw inference request/response data.
 * Never stores the raw prompt — only its hash.
 */
export function buildInferenceAuditEvent(params: {
  requestId: string;
  prompt: string;
  model: string;
  provider: ModelProviderName;
  role: string;
  userId: string;
  orgId?: string;
  privacyMode: string;
  temperature?: number;
  maxTokens?: number;
  usedFallback: boolean;
  outputText: string;
  latencyMs: number;
}): InferenceAuditEvent {
  return {
    requestId: params.requestId,
    model: params.model,
    provider: params.provider,
    promptHash: hashPrompt(params.prompt),
    promptLength: params.prompt.length,
    role: params.role,
    userId: params.userId,
    orgId: params.orgId,
    privacyMode: params.privacyMode,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    usedFallback: params.usedFallback,
    outputTokenEstimate: estimateTokens(params.outputText),
    latencyMs: params.latencyMs,
    createdAtIso: new Date().toISOString()
  };
}

/**
 * Record an AI inference audit event to the rolling window and audit log.
 * Call this after every successful inference request.
 */
export function recordInferenceAuditEvent(event: InferenceAuditEvent): void {
  if (INFERENCE_STORE.length >= MAX_MEMORY_EVENTS) {
    // Evict oldest entry to maintain bounded memory usage
    INFERENCE_STORE.shift();
  }
  INFERENCE_STORE.push(event);

  recordAuditEvent({
    traceId: event.requestId,
    eventType: "ai.inference.completed",
    role: event.role,
    actorId: event.userId,
    orgId: event.orgId,
    severity: "info",
    createdAtIso: event.createdAtIso,
    metadata: {
      model: event.model,
      provider: event.provider,
      promptHash: event.promptHash,
      promptLength: event.promptLength,
      privacyMode: event.privacyMode,
      temperature: event.temperature,
      maxTokens: event.maxTokens,
      usedFallback: event.usedFallback,
      outputTokenEstimate: event.outputTokenEstimate,
      latencyMs: event.latencyMs
    }
  });
}

/**
 * Return a copy of all events in the in-memory rolling window.
 */
export function getRecentInferenceEvents(): InferenceAuditEvent[] {
  return [...INFERENCE_STORE];
}

/**
 * Compute a summary of inference activity from the rolling window.
 */
export function getInferenceAuditSummary(): InferenceAuditSummary {
  if (INFERENCE_STORE.length === 0) {
    return {
      totalInferences: 0,
      uniqueUsers: 0,
      modelUsage: {},
      providerUsage: {},
      fallbackRate: 0,
      avgLatencyMs: 0,
      avgOutputTokens: 0,
      windowStartIso: null,
      windowEndIso: null
    };
  }

  const modelUsage: Record<string, number> = {};
  const providerUsage: Record<string, number> = {};
  let fallbackCount = 0;
  let totalLatency = 0;
  let totalOutputTokens = 0;
  const userIds = new Set<string>();

  for (const event of INFERENCE_STORE) {
    modelUsage[event.model] = (modelUsage[event.model] ?? 0) + 1;
    providerUsage[event.provider] = (providerUsage[event.provider] ?? 0) + 1;
    if (event.usedFallback) fallbackCount++;
    totalLatency += event.latencyMs;
    totalOutputTokens += event.outputTokenEstimate;
    userIds.add(event.userId);
  }

  const count = INFERENCE_STORE.length;
  const chronological = [...INFERENCE_STORE].sort(
    (a, b) =>
      new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime()
  );

  return {
    totalInferences: count,
    uniqueUsers: userIds.size,
    modelUsage,
    providerUsage,
    fallbackRate: fallbackCount / count,
    avgLatencyMs: Math.round(totalLatency / count),
    avgOutputTokens: Math.round(totalOutputTokens / count),
    windowStartIso: chronological[0].createdAtIso,
    windowEndIso: chronological[chronological.length - 1].createdAtIso
  };
}
