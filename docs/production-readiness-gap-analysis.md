# Production Readiness Gap Analysis — RWFW-LOS

> **Date:** 2026-02-25
> **Method:** Full code-level inspection of all API routes, data layer, observability,
> auth, orchestration, LLM, and component wiring. Line-number referenced throughout.
> **Overall verdict:** NOT production-ready. Estimated readiness: 45%.
> **Estimated remediation effort:** 40–50 engineering hours across 5 tracks.

---

## Table of Contents

1. [Readiness Scorecard](#1-readiness-scorecard)
2. [Track A — Data Durability](#2-track-a--data-durability)
3. [Track B — API Security & Validation](#3-track-b--api-security--validation)
4. [Track C — Observability](#4-track-c--observability)
5. [Track D — Orchestration & Federation](#5-track-d--orchestration--federation)
6. [Track E — Feature Completeness](#6-track-e--feature-completeness)
7. [Scalability Analysis](#7-scalability-analysis)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Verification Additions Required](#9-verification-additions-required)
10. [Go / No-Go Criteria](#10-go--no-go-criteria)

---

## 1. Readiness Scorecard

| Domain | Score | Verdict |
|--------|-------|---------|
| Authentication & Route Access | 90% | ✅ Production-ready |
| UI Shell & Navigation | 85% | ✅ Production-ready |
| Feature Flag System | 80% | ✅ Production-ready |
| Onboarding Tour | 80% | ✅ Production-ready |
| Standards Verification | 70% | 🟡 Hardcoded, not configurable |
| Clerk Webhook Handling | 10% | 🔴 Verified but discards payload |
| Ledger Persistence | 15% | 🔴 Breaks silently in serverless |
| Audit Logging | 10% | 🔴 File sink fails in serverless |
| Federation Dispatch | 5% | 🔴 Accepted but never dispatched |
| Runtime State Persistence | 20% | 🔴 Client-only (localStorage) |
| LLM Integration | 30% | 🔴 Endpoint exists, no UI wiring |
| Orchestration Queue | 35% | 🟡 Correct logic, no real execution |
| Data Retention / GDPR | 5% | 🔴 Functions exist, never called |
| Concurrent User Safety | 20% | 🔴 Per-instance state fragmentation |
| **Overall** | **~45%** | **🔴 Soft launch only** |

---

## 2. Track A — Data Durability

### A-1 🔴 CRITICAL — DB Ledger Writes Silently Fail in Serverless
**File:** `lib/ledger/dbAdapter.ts:41–43`

```typescript
// PROBLEM: relative path is read-only on Vercel
export function createDbLedgerAdapter(databasePath = "rootwork-ledger.db"): LedgerAdapter {
  const db = new Database(databasePath);  // throws EACCES or silently fails
```

**Impact:** When `NEXT_PUBLIC_ENABLE_DB_LEDGER=true`, every artifact save, credential record,
and ledger upsert silently drops. The API returns HTTP 200 but writes nothing. Learner data is
permanently lost without any error surfacing to the user.

**Root cause:** Vercel's serverless runtime mounts the project directory read-only. Only `/tmp`
is writable, and `/tmp` is ephemeral per function instance (not shared across instances).

**Fix options (in order of preference):**
```
Option 1 (immediate): Change default path to "/tmp/rootwork-ledger.db"
  - Works for single-instance dev/staging
  - Still breaks under multi-instance production (each instance has its own /tmp)
  - Acceptable for soft launch at low traffic

Option 2 (production): Replace SQLite with a managed concurrent store
  - Neon Postgres (serverless-compatible, connection pooling built-in)
  - PlanetScale / TiDB (MySQL-compatible, HTTP driver works in edge runtime)
  - DynamoDB (AWS, already partially wired in infra/aws-baseline.json)

Option 3 (fast, free): Use Vercel KV (Redis-compatible) for session-scoped state
  - No infra setup required for Vercel projects
  - Appropriate for runtime state; ledger records need a relational store
```

**Immediate fix** (`lib/ledger/dbAdapter.ts`):
```typescript
const DEFAULT_DB_PATH = process.env.LEDGER_DB_PATH ?? "/tmp/rootwork-ledger.db";

export function createDbLedgerAdapter(databasePath = DEFAULT_DB_PATH): LedgerAdapter {
  let db: Database.Database;
  try {
    db = new Database(databasePath);
  } catch (error) {
    throw new Error(`[ledger] DB adapter failed to initialize at ${databasePath}: ${error}`);
  }
  ensureTable(db);
  // ...
}
```

Also add an env var to `env.example`:
```
# Path for SQLite ledger DB. Default: /tmp/rootwork-ledger.db
# Override to a persistent path in non-serverless environments.
LEDGER_DB_PATH=/tmp/rootwork-ledger.db
```

---

### A-2 🔴 CRITICAL — Runtime Mission State Is Client-Only
**File:** `lib/runtime/engine/store.ts:30–37`

```typescript
// ALL writes go only to localStorage — no server persistence
function writeRuntimeState(state: RuntimeState): RuntimeState {
  if (canUseLocalStorage()) {
    localStorage.setItem(RUNTIME_STATE_KEY, JSON.stringify(state));
  } else {
    runtimeFallbackState = state;  // module-scoped in-memory only
  }
  return state;
}
```

**Impact:**
- Refreshing with a different browser loses all mission progress
- Server-side rendering never sees current state
- Multi-device learners (phone → laptop) have split state
- Mission submissions cannot be reviewed server-side without a separate API call

**Hard-coded mission ID compounds this** (`components/ple/PLEHome.tsx:11`):
```typescript
const MISSION_ID = "mission.primary"; // shared across ALL users on same device
```
If two learners use the same device (shared family computer), their mission state collides.

**Fix:**
```typescript
// Use user-scoped mission ID
const MISSION_ID = `mission.${userId}.primary`;
```

**Longer term:** Persist runtime events to an API endpoint that stores them server-side.
`dispatchRuntimeEvent()` should POST to `/api/runtime/events` in addition to local state.

---

### A-3 🟡 HIGH — Data Retention / GDPR Functions Never Called
**File:** `lib/ledger/adapter.ts:55–67`, `lib/runtime/engine/store.ts:40–67`

Four data lifecycle functions are fully implemented but unreachable:
- `purgeLedgerRecordsBefore(cutoffIso)` — time-based ledger retention
- `deleteLedgerRecordsByLearner(learnerId)` — GDPR-style learner deletion
- `purgeRuntimeStateBefore(cutoffIso)` — runtime state retention
- `deleteRuntimeStateByLearner(learnerId)` — GDPR-style runtime deletion

No API endpoint, admin screen, or scheduled job invokes any of these. In an educational context
(FERPA, COPPA, state-level student privacy laws), the inability to honor deletion requests is a
compliance blocker.

**Fix:** Create admin API endpoints:
```
POST /api/admin/learner/:learnerId/delete   → calls deleteLedgerRecordsByLearner + deleteRuntimeStateByLearner
POST /api/admin/ledger/purge                → calls purgeLedgerRecordsBefore
```
Wire these to the Admin Evidence screen and add a confirmation UI.

---

### A-4 🟡 HIGH — Artifact Save Is Not Idempotent
**File:** `components/studio/StudioWorkspace.tsx:61–151`

If a learner clicks Save and the network request partially fails, retrying produces a duplicate
ledger record. The artifact ID is generated server-side on each call rather than client-side.

**Fix:**
```typescript
// Generate stable ID on client before sending
const artifactId = `artifact.${userId}.${Date.now()}`;
// Include as idempotency key in POST body
```

---

## 3. Track B — API Security & Validation

### B-1 🔴 CRITICAL — Clerk Webhook Discards Event Payload
**File:** `app/api/webhooks/clerk/route.ts:68–94`

HMAC signature verification is cryptographically correct (uses `timingSafeEqual` at line 17).
However, after accepting the verified webhook, the handler does nothing:

```typescript
const handledTypes = new Set(["user.created", "user.updated"]);
const handled = handledTypes.has(eventType);
// ... no if/else branches follow. Payload is discarded.
return NextResponse.json({ ok: true, handled }, { status: 200 });
```

**Impact:** Role changes made in Clerk's dashboard never reach the app. A user whose role is
updated from `student_independent` to `teacher` will continue to see the student dashboard until
they log out and back in. For admin role escalations this is a security concern.

**Fix:**
```typescript
if (eventType === "user.created" || eventType === "user.updated") {
  const userId = event.data?.id as string | undefined;
  const role = event.data?.public_metadata?.role as string | undefined;
  if (userId && role) {
    // Persist to a server-side role cache (DynamoDB, Redis, or Vercel KV)
    await roleCache.set(userId, role);
  }
}
```

---

### B-2 🔴 CRITICAL — Ledger API Missing Authorization Check
**File:** `app/api/ledger/records/route.ts:75`

```typescript
// Missing: validate payload.learnerId === authenticated user's ID
const stored = createDbLedgerAdapter().upsert(payload);
```

A malicious client can POST `{ learnerId: "victim_user_id", ... }` and write records attributed
to another learner. This is a data integrity and privacy violation.

**Fix:**
```typescript
const user = await currentUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Enforce: you can only write your own records
if (payload.learnerId !== user.id) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

### B-3 🟡 HIGH — Inference Endpoint Has No Input Validation or Rate Limiting
**File:** `app/api/inference/route.ts:31–44`

```typescript
// Prompt is accepted with only whitespace trim — no length cap, no injection prevention
const trimmed = body.prompt?.trim();
```

**Issues:**
1. No maximum prompt length → DoS via extremely large prompts consuming LLM quota
2. No prompt injection prevention → adversarial instructions can override system behavior
3. No per-user rate limiting → one user can exhaust the Gemini/Ollama quota

**Fix:**
```typescript
const MAX_PROMPT_CHARS = 4000;
if (!trimmed || trimmed.length > MAX_PROMPT_CHARS) {
  return NextResponse.json({ error: "prompt_invalid" }, { status: 400 });
}
// Add rate limiter middleware (Vercel's @upstash/ratelimit works well)
```

---

### B-4 🟡 HIGH — Federation Endpoint Accepts Unvalidated Payloads
**File:** `app/api/federation/route.ts:53`

```typescript
// Type assertion without structural validation
const body = (await request.json()) as { task?: FederationTaskEnvelope };
```

A malformed request body can reach `resolveFederationAssignment(body.task)` and crash or
produce invalid audit metadata. Use a runtime schema validator:

```typescript
import { z } from "zod";
const TaskSchema = z.object({
  taskId: z.string().uuid(),
  capabilityId: z.string().min(1),
  requestedByRole: z.enum(APP_ROLES),
  // ...
});
const parsed = TaskSchema.safeParse(body.task);
if (!parsed.success) {
  return NextResponse.json({ error: "invalid_task_payload" }, { status: 400 });
}
```

---

### B-5 🟡 HIGH — Health Endpoints Report Status Without Connectivity Checks
**File:** `app/api/ai/health/route.ts:12–17`

```typescript
const localEnabled = await local.isAvailable();  // checks flag only
const cloudEnabled = await cloud.isAvailable();  // checks env vars only
```

`isAvailable()` on both providers only inspects environment variables. A provider can be
"available" per this check even if the downstream service is unreachable. Monitoring systems
that trust this health endpoint will route traffic to a broken instance.

**Fix:** Each `isAvailable()` should make a lightweight connectivity probe:
- Ollama: `GET http://localhost:11434/api/tags` with 500ms timeout
- AWS: `ListEventBuses` with 1s timeout, cached for 30s

---

### B-6 🟡 HIGH — Worker Run Endpoint Silently Accepts Malformed JSON
**File:** `app/api/orchestration/worker-run/route.ts:61`

```typescript
const body = (await request.json().catch(() => ({}))) as WorkerRunBody;
```

Malformed JSON silently defaults to `{}`. The route continues with an empty body, producing
misleading state transitions. Return a 400 instead:

```typescript
let body: WorkerRunBody;
try {
  body = await request.json();
} catch {
  return NextResponse.json({ error: "invalid_json" }, { status: 400 });
}
```

---

## 4. Track C — Observability

### C-1 🔴 CRITICAL — Audit Log Has No Durable Sink
**File:** `lib/observability/audit.ts:17–35`

```typescript
const AUDIT_LOG_PATH = resolve("docs", "status", "audit-log.ndjson");

async function appendAuditEventToFile(event: AuditEvent): Promise<void> {
  await mkdir(directory, { recursive: true });
  await appendFile(AUDIT_LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");
  // ↑ throws EACCES on Vercel — caught and swallowed below
}

void appendAuditEventToFile(event).catch((error) => {
  console.warn(`[audit] file_sink_failed ${error instanceof Error ? error.message : "unknown_error"}`);
});
```

In production, every audit event (federation requests, webhook validation, role checks) silently
fails to persist. The `console.warn` goes to Vercel's ephemeral log stream — not queryable after
a few hours and not retained.

**Fix options:**

```typescript
// Option A: Vercel Log Drains (zero config if on Vercel)
// Set up a log drain to Datadog/Logtail — console.log JSON is sufficient
export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  // Structured log always goes somewhere
  console.log(JSON.stringify({ _type: "audit", ...event }));

  // Optional: also write to DynamoDB for queryability
  if (process.env.AUDIT_DYNAMO_TABLE) {
    await dynamoClient.send(new PutCommand({
      TableName: process.env.AUDIT_DYNAMO_TABLE,
      Item: { pk: `audit#${event.traceId}`, ...event, ttl: Math.floor(Date.now() / 1000) + 90 * 86400 }
    }));
  }
}
```

```typescript
// Option B: Vercel KV (Redis) for queryable recent events
await kv.lpush("audit:recent", JSON.stringify(event));
await kv.ltrim("audit:recent", 0, 9999); // keep last 10k events
```

**Required:** Add an admin API route `GET /api/admin/audit` to query the audit log.

---

### C-2 🟡 HIGH — Trace IDs Not Correlated to a Tracing Backend
**File:** `lib/observability/trace.ts`, `middleware.ts`

Trace IDs are correctly generated and propagated via `X-Trace-Id` headers. However, they are
never submitted to any tracing backend (Datadog APM, OpenTelemetry, Vercel Analytics). They
exist in response headers but are invisible in any monitoring system.

**Fix:** Add OpenTelemetry instrumentation:
```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```
Configure a Vercel-compatible exporter. Trace IDs then become queryable spans.

---

### C-3 🟡 MEDIUM — No Error Boundary Reporting
No integration with Sentry or equivalent. Unhandled React errors in client components surface
to the built-in `error.tsx` boundary but are never reported to an alerting system.

**Fix:**
```bash
npm install @sentry/nextjs
```
Configure `sentry.client.config.ts` and `sentry.server.config.ts`. Wire `error.tsx` to
`Sentry.captureException()`.

---

## 5. Track D — Orchestration & Federation

### D-1 🔴 CRITICAL — Federation Accepts Tasks But Never Dispatches Them
**File:** `app/api/federation/route.ts:59–109`

```typescript
const routing = resolveFederationAssignment(body.task);  // routing decision made
// ... but the result is never used to enqueue or dispatch the task
return NextResponse.json(responseEnvelope, { status: 200 });  // accepted, dropped
```

`resolveFederationAssignment()` returns an assigned agent ID and routing decision. The handler
logs an audit event and returns 200, but the task is never enqueued to `InMemoryQueueAdapter`,
`SqsQueueAdapter`, or any execution layer.

**Fix:**
```typescript
if (routing.accepted && routing.assignedAgentId) {
  const queue = canUseAwsQueue() ? new SqsQueueAdapter(...) : new InMemoryQueueAdapter();
  await queue.enqueue({
    jobId: body.task.taskId,
    idempotencyKey: body.task.correlationId,
    payload: body.task,
    priority: 5,
    // ...
  });
}
```

---

### D-2 🟡 HIGH — DynamoDB State Store Lacks Conditional Writes and TTL
**File:** `lib/orchestration/dynamoStateStore.ts:13–26`

```typescript
await this.client.send(new PutCommand({
  TableName: this.tableName,
  Item: { pk: `job#${job.jobId}`, sk: "state", ...job }
  // Missing: ConditionExpression, TTL attribute
}));
```

**Issues:**
1. No `ConditionExpression` → two workers can overwrite each other's state (race condition)
2. No TTL attribute → table grows unbounded; old jobs never expire
3. GSI `sk-index` referenced in `list()` but not documented or guaranteed to exist

**Fix:**
```typescript
new PutCommand({
  TableName: this.tableName,
  Item: {
    pk: `job#${job.jobId}`,
    sk: "state",
    ttl: Math.floor(Date.now() / 1000) + 30 * 86400, // 30-day TTL
    ...job
  },
  ConditionExpression: "attribute_not_exists(pk) OR #status = :expected",
  ExpressionAttributeNames: { "#status": "status" },
  ExpressionAttributeValues: { ":expected": job.status }
})
```

---

### D-3 🟡 HIGH — SQS Adapter Assumes FIFO Queue Without Validation
**File:** `lib/orchestration/sqsQueueAdapter.ts:14–19`

```typescript
new SendMessageCommand({
  QueueUrl: this.queueUrl,
  MessageDeduplicationId: job.idempotencyKey, // FIFO-only attribute
  MessageGroupId: "rootwork-orchestration"    // FIFO-only attribute
})
```

If `AWS_SQS_QUEUE_URL` points to a standard queue, these attributes cause SQS to reject the
message with `InvalidParameterValue`. The error is uncaught.

**Fix:** Validate queue URL format and wrap in try-catch:
```typescript
if (!this.queueUrl.endsWith(".fifo")) {
  throw new Error("[sqs] Queue must be a FIFO queue (.fifo suffix required)");
}
```

---

### D-4 🟡 MEDIUM — Agent Registry Is Hardcoded
**File:** `lib/federation/registry.ts:6–46`

The agent registry is a compile-time constant. Adding a new agent capability requires a code
deployment. Dynamic agent registration (useful for local dev, parallel agents, or hot-swapping
capabilities) is not possible.

**Fix:** Migrate registry to Vercel KV or DynamoDB:
```typescript
export async function registerAgent(reg: AgentRegistration): Promise<void> {
  await kv.hset("federation:registry", reg.agentId, JSON.stringify(reg));
}
export async function getRegistry(): Promise<AgentRegistration[]> {
  const entries = await kv.hgetall("federation:registry");
  return Object.values(entries ?? {}).map((e) => JSON.parse(e as string));
}
```
Add `POST /api/federation/register` and `DELETE /api/federation/agents/:id` endpoints.

---

## 6. Track E — Feature Completeness

### E-1 🟡 HIGH — Placeholder Screens Have No Data
The following screens are scaffold UI only — buttons do not invoke any server action, and data
is hardcoded demo content:

| Screen | Component | Gap |
|--------|-----------|-----|
| Reviews | `ReviewQueue.tsx` | Approve/Return/Flag buttons have no handlers; demo data only |
| Builder | `BuilderWorkspace.tsx` | Forms do not submit; no `onSubmit` handlers wired |
| Cohorts | `CohortList.tsx` | 3 hardcoded demo cohorts; no real data source |
| Missions | `MissionsList.tsx` | Static scaffold; doesn't read from runtime state |
| Portfolio | `PortfolioView.tsx` | Static scaffold; doesn't read from ledger |
| Pickups | `PickupsWorkspace.tsx` | Flag-gated correctly; enabled UI is static |

Each needs a dedicated server action or API call:
- Reviews → `POST /api/reviews/:artifactId/verdict` dispatching `VERIFICATION_COMPLETED` event
- Builder → `POST /api/missions` and `POST /api/cohorts` writing to state store
- Missions → read from `readRuntimeState()` (client-side) or `/api/runtime/state`
- Portfolio → read from `/api/ledger/records?learnerId=:id`

---

### E-2 🟡 HIGH — LLM Integration Exists But Has No UI Entry Point
**Files:** `app/api/inference/route.ts`, `lib/llm/router.ts`

The inference API endpoint is fully implemented. The `ModelRouter` correctly falls back from
Ollama to Cloud. However, no component in the UI calls this endpoint. The Studio workspace has
no "AI Assist" button.

**Fix:** Add to `StudioWorkspace.tsx`:
```typescript
async function requestAiAssist(): Promise<void> {
  const response = await fetch("/api/inference", {
    method: "POST",
    body: JSON.stringify({ prompt: artifactContent, model: "auto" }),
  });
  const { outputText } = await response.json();
  setArtifactContent((prev) => prev + "\n\n" + outputText);
}
```

---

### E-3 🟡 MEDIUM — CloudManagedProvider Is Fire-and-Forget
**File:** `lib/llm/providers/cloudManaged.ts:27–65`

The provider sends an EventBridge event and returns a fake success response:
```typescript
return {
  outputText: `Cloud inference request accepted (eventId=${eventId}).`,
  usedFallback: false,  // ← misleading: no inference occurred yet
};
```

The client has no way to retrieve the actual inference result. This is architecturally
incomplete — either implement request/response correlation (via a polling endpoint or WebSocket)
or document clearly that cloud inference is async-only and results are delivered out-of-band.

---

### E-4 🟢 MEDIUM — Standards Are Hardcoded; Admin Cannot Configure
**File:** `lib/standards/verifier/localVerifier.ts:3–14`

Only 2 standards (`rw.mission.clarity`, `rw.artifact.reflection`) are hardcoded. The
`/app/standards` admin screen (just implemented) shows them read-only. Admins cannot add,
weight, or disable standards without a code deploy.

The plugin architecture (`lib/standards/contracts/plugins.ts`) already supports extensibility.
The missing piece is:
1. A standards persistence layer (Vercel KV or Postgres table of `StandardDescriptor` rows)
2. An admin write API `POST /api/admin/standards` and `DELETE /api/admin/standards/:id`
3. Wire the Standards admin screen to these endpoints

---

## 7. Scalability Analysis

### At 10 concurrent users (soft launch)
- ✅ Auth/Clerk: scales (managed service)
- ✅ Static rendering: scales (CDN-cached)
- 🟡 DB Ledger: works if path fixed to `/tmp`; fragmented per instance
- 🟡 Audit: console logs only; no queryable history
- 🔴 Runtime state: client-only; no server visibility

### At 100 concurrent users
| Component | Failure Mode |
|-----------|-------------|
| DB Ledger (SQLite) | Each Vercel instance has its own `/tmp` DB. 100 users → fragmented across N instances. No shared state. |
| Audit Log | Console only; Vercel retains ~24h of logs. No audit trail queryable after one day. |
| Mission State | localStorage only; server never sees current state. |
| Clerk Role Checks | Each page load calls `currentUser()`. No server-side role cache. High Clerk API latency at scale. |
| Federation Registry | Module-level constant reloaded on cold start. Acceptable until dynamic registration is needed. |
| Inference API | No rate limiting. One user can exhaust Gemini quota for all users. |

### At 1000 concurrent users
All of the above, plus:
- SQLite is a single-writer database; concurrent writes from a single instance serialize. At high concurrency even `/tmp` SQLite becomes a bottleneck.
- The `InMemoryQueueAdapter` is per-process; jobs from one instance are invisible to others.
- Better-sqlite3 is a native module; cold starts are slower than JS-only alternatives.

**Recommended stack for 1000+ users:**
- Ledger → Neon Postgres (serverless, connection-pooled, persistent)
- Runtime state → Vercel KV (Redis-compatible, instant, no cold start)
- Audit → DynamoDB with TTL + Vercel Log Drain → Datadog
- Queue → SQS FIFO + Lambda consumer
- Role cache → Vercel KV (invalidated by Clerk webhook)

---

## 8. Implementation Roadmap

### Phase P-1: Critical Fixes (Week 1 — ~12 hours)
*Unblock production. Nothing is safely deployable until these are done.*

| Task | File(s) | Effort | Owner |
|------|---------|--------|-------|
| Fix DB ledger path to `/tmp` + startup check | `lib/ledger/dbAdapter.ts` | 1h | solo |
| Implement audit durable sink (console JSON + optional DynamoDB) | `lib/observability/audit.ts` | 3h | solo |
| Wire Clerk webhook role sync | `app/api/webhooks/clerk/route.ts` | 3h | solo |
| Add learnerId authorization to ledger API | `app/api/ledger/records/route.ts` | 1h | solo |
| Federation task enqueuing after routing | `app/api/federation/route.ts` | 3h | solo |
| Fix hard-coded mission ID to user-scoped | `components/ple/PLEHome.tsx:11` | 1h | solo |

---

### Phase P-2: High-Priority Fixes (Week 2 — ~16 hours)
*Required before open access / any real user data.*

| Task | File(s) | Effort | Owner |
|------|---------|--------|-------|
| Prompt validation + rate limiting on inference | `app/api/inference/route.ts` | 3h | solo |
| Zod schema validation for federation payloads | `app/api/federation/route.ts` | 2h | solo |
| Real connectivity checks in `isAvailable()` | `lib/llm/providers/localOllama.ts`, `cloudManaged.ts` | 2h | solo |
| Fix SQS adapter FIFO validation + error handling | `lib/orchestration/sqsQueueAdapter.ts` | 2h | solo |
| DynamoDB TTL + conditional writes | `lib/orchestration/dynamoStateStore.ts` | 2h | solo |
| Admin API for data retention / GDPR deletion | `app/api/admin/learner/[id]/delete/route.ts` (new) | 4h | solo |
| Fix malformed JSON handling in worker-run | `app/api/orchestration/worker-run/route.ts:61` | 1h | solo |

---

### Phase P-3: Scalability & Persistence (Week 3–4 — ~20 hours)
*Required for > 20 concurrent users.*

| Task | Effort |
|------|--------|
| Migrate ledger from SQLite to Neon Postgres or DynamoDB | 8h |
| Migrate runtime state to Vercel KV with server-side persistence API | 6h |
| Add Vercel KV role cache invalidated by Clerk webhook | 3h |
| Add OpenTelemetry + Sentry error reporting | 3h |

---

### Phase P-4: Feature Completeness (Parallel — ~20 hours)
*Bring scaffold screens to real functionality.*

| Screen | Task | Effort |
|--------|------|--------|
| Reviews | Wire Approve/Return/Flag to `/api/reviews/:id/verdict` | 4h |
| Builder | Wire mission + cohort forms to server actions | 4h |
| Missions | Read from runtime state or `/api/runtime/state` | 3h |
| Portfolio | Read from `/api/ledger/records` | 3h |
| Studio | Add AI Assist button calling `/api/inference` | 3h |
| Standards | Wire admin CRUD to standards persistence | 3h |

---

## 9. Verification Additions Required

Current `verify:release-gate` does not catch any of the critical issues above. Add:

```bash
# Verify DB adapter is writable at configured path
npm run verify:ledger-writable

# Verify audit log has a durable sink configured
npm run verify:audit-sink

# Verify federation dispatch reaches a queue (integration test)
npm run verify:federation-dispatch

# Verify webhook role sync updates are applied
npm run verify:webhook-role-sync

# Verify no cross-learner data leakage in ledger API
npm run verify:ledger-acl

# Verify prompt length limits are enforced
npm run verify:inference-validation
```

Add these to `scripts/verify-release-gate.mjs` as required checks before any production deploy.

---

## 10. Go / No-Go Criteria

### Minimum for Soft Launch (≤ 20 users, controlled access)
- [ ] A-1: DB ledger path fixed (or ledger disabled and only localStorage used)
- [ ] B-2: Ledger API learnerId authorization check added
- [ ] C-1: Audit events emit structured JSON to console (Log Drain configured)
- [ ] B-1: Webhook at minimum logs role changes (even without caching)
- [ ] A-4: Mission ID is user-scoped (not `"mission.primary"`)

### Minimum for General Availability (unlimited users)
All soft launch criteria, plus:
- [ ] A-1: Ledger migrated to Postgres/DynamoDB (not SQLite)
- [ ] A-2: Runtime state has server-side persistence
- [ ] B-1: Webhook role sync fully implemented with KV cache
- [ ] C-1: Audit log written to DynamoDB with queryable admin endpoint
- [ ] D-1: Federation dispatch enqueues to SQS
- [ ] B-3: Rate limiting on inference and all write endpoints
- [ ] E-1: Scaffold screens replaced with real data wiring
- [ ] C-3: Sentry error reporting integrated
- [ ] All Phase P-1 and P-2 tasks complete

### Production Scale (100+ users)
All GA criteria, plus Phase P-3 complete.

---

*Generated from full code-level inspection — 2026-02-25.*
*Update this document after each remediation sprint.*
*Owner: engineering lead. Review cadence: weekly until GA.*
