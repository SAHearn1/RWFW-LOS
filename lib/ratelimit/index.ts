/**
 * Lightweight per-user sliding-window rate limiter.
 *
 * Uses in-memory storage — resets on Vercel cold starts. This is acceptable
 * as a cost/abuse guard for a small-scale platform. For high-scale production,
 * replace with @upstash/ratelimit + Redis.
 */

import { NextResponse } from "next/server";
import { TRACE_HEADER } from "@/lib/observability/trace";

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export type RateLimitConfig = {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
};

/** Preset configs for different route tiers */
export const RATE_LIMITS = {
  /** LLM inference — expensive AWS Bedrock / Ollama calls */
  inference: { limit: 10, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Mutation endpoints (POST/PUT/DELETE) */
  mutation: { limit: 30, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Read endpoints */
  read: { limit: 100, windowMs: 60_000 } satisfies RateLimitConfig,
} as const;

type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterMs: number };

/**
 * Check whether the given key (typically userId) is within the rate limit.
 */
export function checkRateLimit(
  key: string,
  route: string,
  config: RateLimitConfig
): RateLimitResult {
  const windowMs = config.windowMs ?? 60_000;
  const now = Date.now();
  const compositeKey = `${key}:${route}`;

  cleanupStaleEntries(windowMs);

  let entry = store.get(compositeKey);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(compositeKey, entry);
  }

  // Remove timestamps outside the window
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: config.limit - entry.timestamps.length };
}

/**
 * Apply rate limiting and return a 429 response if exceeded.
 * Returns null if the request is allowed.
 */
export function enforceRateLimit(
  userId: string,
  route: string,
  config: RateLimitConfig,
  traceId: string
): Response | null {
  const result = checkRateLimit(userId, route, config);

  if (!result.allowed) {
    const retryAfterSec = Math.ceil(result.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          [TRACE_HEADER]: traceId,
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
