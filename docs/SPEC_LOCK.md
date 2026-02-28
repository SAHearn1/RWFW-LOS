# SPEC_LOCK.md — RootWork LOS Authoritative Specification

> **SPEC LOCK SUPREMACY**: This document is law. All implementation must conform to this specification.
> If any implementation conflicts with this spec, the implementation must change — NOT this specification —
> unless the Architect Agent explicitly approves and records an amendment here.
>
> Last amended: 2026-02-28 (Eighth pass — Autonomous Org initialization)
> Branch: `claude/setup-autonomous-org-system-wDC75`

---

## Table of Contents

1. [System Identity](#1-system-identity)
2. [Non-Negotiable Invariants](#2-non-negotiable-invariants)
3. [Auth & Role Architecture](#3-auth--role-architecture)
4. [Route Access Contract](#4-route-access-contract)
5. [Navigation Contract](#5-navigation-contract)
6. [Feature Flag Contract](#6-feature-flag-contract)
7. [Data Model Contract](#7-data-model-contract)
8. [API Security Contract](#8-api-security-contract)
9. [Observability Contract](#9-observability-contract)
10. [AI / LLM Governance Contract](#10-ai--llm-governance-contract)
11. [Multi-Tenant Isolation Contract](#11-multi-tenant-isolation-contract)
12. [Release Gate Contract](#12-release-gate-contract)
13. [Autonomous Org Governance](#13-autonomous-org-governance)
14. [Amendment Log](#14-amendment-log)

---

## 1. System Identity

**System:** RootWork Learning Operating System (RWFW-LOS)
**Runtime:** Next.js 15 App Router on Vercel (serverless, stateless, edge-compatible)
**Auth Provider:** Clerk (`@clerk/nextjs` ^6.31.6)
**Database:** SQLite via `better-sqlite3` (local/dev), DynamoDB (production ledger)
**AI Layer:** Google Gemini (`@google/genai`), Ollama (local), AWS Bedrock (cloud managed)
**Deployment Target:** Vercel production + preview deployments

### System Boundaries

```
Public:   /            (Landing page — no auth)
          /sign-in/**  (Clerk auth UI)
          /sign-up/**  (Clerk auth UI)
          /api/health  (Platform health — unauthenticated OK)

Protected: /app/**     (Clerk session required — all routes)
           /api/**     (Role-gated — varies by endpoint)
```

---

## 2. Non-Negotiable Invariants

The following invariants **MUST NEVER regress**. Any PR that causes regression is automatically blocked.

### INV-01: Tenant Isolation
Every data read/write operation scoped to a `learnerId` or `orgId` MUST enforce that the
requesting user's authenticated identity matches the scope. No cross-tenant data leakage is
permitted under any circumstances.

### INV-02: Authentication Gate
All `/app/**` routes require a valid Clerk session. The middleware (`middleware.ts`) enforces
this unconditionally. No bypass is permitted even for "developer convenience."

### INV-03: RBAC Integrity
All route access decisions flow from `lib/auth/routeAccess.ts` → `APP_ROUTE_DEFINITIONS`.
No ad hoc `user.role === "admin"` checks are permitted anywhere outside `lib/auth/*`.

### INV-04: Org Enforcement
Roles in `ORG_REQUIRED_ROLES` (defined in `lib/auth/roles.ts`) MUST have a Clerk `orgId` to
access `/app/**`. This check lives in `app/app/layout.tsx` and uses the canonical set from
`roles.ts`. No duplicate role lists permitted.

### INV-05: Audit Completeness
All privileged operations (role assignment, data deletion, federation dispatch, webhook events)
MUST emit an audit event via `recordAuditEvent()`. Audit failures MUST NOT block the primary
operation but MUST be logged as warnings.

### INV-06: Feature Flag Safety
Every feature flag default is `false`. When a flag is disabled, the system MUST degrade
gracefully — no crashes, no blank screens, no 500 errors. Graceful response patterns:
- API endpoints: return `503` with `{ status: "disabled", reason: "..." }`
- UI components: render a disabled/unavailable placeholder

### INV-07: AI Safety Boundaries
All AI (LLM) calls MUST be:
- Tenant-scoped (no cross-learner prompt contamination)
- Versioned (model ID logged with each call)
- Auditable (trace ID propagated through the call chain)
- Bounded (timeout + fallback required)

### INV-08: Compliance Retention
Data deletion operations (`purge_before`, `delete_learner`) MUST:
- Require `admin` or `super_admin` role
- Emit an audit event with actorId, scope, and cutoff
- Operate consistently across all adapter layers (in-memory, SQLite, DynamoDB)
- Use strict-before semantics: `updatedAt < cutoffIso` (records AT the cutoff are preserved)

### INV-09: Constant-Time Token Comparison
All bearer token / secret comparisons MUST use `crypto.timingSafeEqual()`. Plain string
`===` comparison on secrets is forbidden.

### INV-10: No Hidden Magic
Every routing, role, and flag decision MUST be explicit and traceable to a contract in
`lib/auth/routeAccess.ts`, `lib/auth/roles.ts`, or `lib/config/featureFlags.ts`.
Silent fallthrough behavior (e.g., unhandled role → PLEHome) is forbidden.

---

## 3. Auth & Role Architecture

### Canonical Role List (`lib/auth/roles.ts`)

```typescript
export const APP_ROLES = [
  "student_independent",
  "student_enrolled",
  "adult_learner",
  "teacher",
  "professional_development",
  "admin",
  "super_admin",
] as const;
```

### Org-Required Roles (`lib/auth/roles.ts`)

```typescript
export const ORG_REQUIRED_ROLES = new Set<AppRole>([
  "student_enrolled",
  "teacher",
  "professional_development",
  "admin",
  "super_admin",
]);
```

`student_independent` and `adult_learner` are intentionally excluded — they self-enroll
without an institution.

### Role Storage
Roles are stored in **Clerk `publicMetadata.role`** as a plain string matching an `AppRole`
value exactly. Role assignment is only possible via `/api/super-admin/assign-role`
(super_admin only) or the Clerk webhook handler.

### Role Groupings (`lib/auth/routeAccess.ts` — exported)

| Export | Members |
|--------|---------|
| `LEARNER_ROLES` | student_independent, student_enrolled, adult_learner |
| `FACILITATOR_ROLES` | teacher, professional_development |
| `ADMIN_ROLE` | admin |
| `SUPER_ADMIN_ROLE` | super_admin |
| `ALL_ROLES` | All 7 (derived from `APP_ROLES`) |

---

## 4. Route Access Contract

**Single source of truth:** `lib/auth/routeAccess.ts#APP_ROUTE_DEFINITIONS`

Any route addition MUST update ALL of:
1. `lib/auth/routeAccess.ts` (APP_ROUTE_DEFINITIONS)
2. `docs/qa/role-matrix.md`
3. `lib/nav/items.ts` (if it appears in navigation)
4. `scripts/verify-role-routes.mjs` (if access pattern check needed)

### Current Route Matrix (as of 2026-02-28)

| Route | si | se | al | tc | pd | ad | sa | Notes |
|-------|----|----|----|----|----|----|----|-------|
| `/app` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Role-specific home |
| `/app/profile` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/app/core` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Flag-gated bridge |
| `/app/missions` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Learner only |
| `/app/studio` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Learner only |
| `/app/portfolio` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Learner only |
| `/app/credentials` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Learner only |
| `/app/settings` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Learner only |
| `/app/command-center` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | Facilitator only |
| `/app/cohorts` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | Facilitator only |
| `/app/pickups` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | Facilitator only (flag-gated) |
| `/app/reviews` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | Facilitator only |
| `/app/builder` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | Facilitator only |
| `/app/standards` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Admin+ only |
| `/app/evidence` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Admin+ only |
| `/app/exports` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Admin+ only |
| `/app/retention` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Admin+ only |
| `/app/super-admin/users` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Super-admin only |
| `/app/super-admin/teachers` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Super-admin only |
| `/app/super-admin/licenses` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Super-admin only |
| `/app/super-admin/institutions` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Super-admin only |
| `/app/super-admin/audit-log` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Super-admin only |
| `/app/forbidden` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | In-app 403 |

**Column key:** si=student_independent, se=student_enrolled, al=adult_learner, tc=teacher,
pd=professional_development, ad=admin, sa=super_admin

---

## 5. Navigation Contract

**Single source of truth:** `lib/nav/items.ts#NAV_ITEMS_BY_ROLE`

Every role has its own explicit `NavItem[]`. No shared list with filtering. Adding a role to
`APP_ROLES` MUST be accompanied by a nav items entry.

### Required Nav Items by Role

| Role | Required Links |
|------|---------------|
| student_independent | Home, Missions, Studio, Portfolio, Credentials, Settings, Core, Profile |
| student_enrolled | Home, Missions, Studio, Portfolio, Credentials, Settings, Core, Profile |
| adult_learner | Home, Missions, Studio, Portfolio, Credentials, Settings, Core, Profile |
| teacher | Home, Command Center, Cohorts, Pickups (if flag), Reviews, Builder, Core, Profile |
| professional_development | Home, Command Center, Cohorts, Pickups (if flag), Reviews, Builder, Core, Profile |
| admin | Home, Standards, Evidence, Exports, Retention, Core, Profile |
| super_admin | Dashboard, Users, Teacher Assignment, Licenses, Institutions, Audit Log, Core, Profile |

---

## 6. Feature Flag Contract

**Single source of truth:** `lib/config/featureFlags.ts` + `.env.example`

Every new flag MUST:
1. Be added to `featureFlags.ts` with a `false` default
2. Be added to `.env.example` with a descriptive comment
3. Degrade gracefully when disabled (no crashes)
4. Be documented here in this section

### Active Flags

| Flag | Default | Consumers | Behavior when false |
|------|---------|-----------|---------------------|
| `NEXT_PUBLIC_ENABLE_LEDGER` | false | Studio, Credentials, Evidence | Disabled save/load |
| `NEXT_PUBLIC_ENABLE_MCP` | false | `/api/mcp/health` | Returns 503 |
| `NEXT_PUBLIC_ENABLE_PICKUP` | false | Facilitator nav, Pickups page | Nav item hidden |
| `NEXT_PUBLIC_ENABLE_OFFLINE` | false | `/api/offline/status` | Returns 503 |
| `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT` | false | `/app/core`, tour step | Core mount hidden |
| `NEXT_PUBLIC_ENABLE_RUNTIME` | false | Mission lifecycle events | Events suppressed |
| `NEXT_PUBLIC_ENABLE_DB_LEDGER` | false | `isDbLedgerFlagEnabled()` | Uses in-memory adapter |
| `NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER` | false | StudioWorkspace | Verification disabled |
| `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA` | false | LLM router | Local LLM skipped |
| `NEXT_PUBLIC_ENABLE_FEDERATION` | false | `/api/federation` | Returns 503 |

---

## 7. Data Model Contract

All data models are immutable contracts. Field additions are additive (backwards-compatible).
Field removals require a migration + deprecation window.

### RuntimeMission
```typescript
{
  id: string;           // UUID
  learnerId: string;    // Clerk userId
  title: string;
  stage: "not_started" | "in_progress" | "submitted" | "verified";
  createdAtIso: string; // ISO 8601
  updatedAtIso: string; // ISO 8601
}
```

### RuntimeArtifact
```typescript
{
  id: string;
  missionId: string;
  learnerId: string;
  content: string;
  updatedAtIso: string;
}
```

### VerificationEvent
```typescript
{
  id: string;
  missionId: string;
  artifactId: string;
  standards: string[];
  verdict: "pass" | "partial" | "missing";
  createdAtIso: string;
}
```

### LedgerRecord
```typescript
{
  id: string;
  type: "mission" | "artifact" | "verification";
  missionId: string;
  learnerId: string;
  payload: RuntimeMission | RuntimeArtifact | VerificationEvent;
  createdAtIso: string;
  updatedAtIso: string;
}
```

### AuditEvent
```typescript
{
  traceId: string;
  eventType: string;
  role: string;
  orgId?: string;
  actorId?: string;
  severity: "info" | "warning" | "error";
  metadata?: Record<string, unknown>;
  createdAtIso: string;
}
```

### OrchestrationJobEnvelope
```typescript
{
  jobId: string;
  idempotencyKey: string;
  status: string;
  attempt: number;
  priority: number;
  retryPolicy: { maxAttempts: number; backoffMs: number };
  payload: unknown;
  lastErrorCode?: string;
  lastErrorMessage?: string;
}
```

### FederationTaskEnvelope
```typescript
{
  taskId: string;
  correlationId: string;
  requestedByRole: string;
  assignedAgentId: string;
  capabilityId: string;
  payload: Record<string, unknown>;
}
```

---

## 8. API Security Contract

All API routes MUST conform to:

### Authentication Pattern
```typescript
const user = await currentUser();
if (!user) {
  return NextResponse.json({ error: "Authentication required." }, { status: 401, ... });
}
```

### Authorization Pattern
```typescript
const role = parseAppRole(user.publicMetadata?.role);
if (!role || !ALLOWED_ROLES.has(role)) {
  return NextResponse.json({ error: "<required> role required." }, { status: 403, ... });
}
```

### External Network Call Pattern (MANDATORY)
```typescript
let response: globalThis.Response;
try {
  response = await fetch(url, options);
} catch (error) {
  console.error("[route] fetch_failed", error instanceof Error ? error.message : "unknown");
  return NextResponse.json({ error: "Service unavailable." }, { status: 502, ... });
}
```

### Trace Header
Every response MUST include `{ [TRACE_HEADER]: traceId }` in headers.
`TRACE_HEADER = "x-rootwork-trace-id"` (lowercase, canonical).

### Runtime Declaration
Every API route file MUST declare `export const runtime = "nodejs";` to ensure
Node.js-specific APIs (crypto, fs, sqlite) are available and to guarantee consistent
serverless behavior.

### Rate Limiting
Mutating API endpoints (`POST`, `DELETE`, `PATCH`) MUST call `enforceRateLimit()` from
`lib/ratelimit` before processing.

---

## 9. Observability Contract

### Trace IDs
- Generated via `crypto.randomUUID()` (v4 UUID, no collision risk)
- Propagated through all requests via `x-rootwork-trace-id` header
- Included in all audit events

### Audit Events
- All privileged operations: role assignment, data deletion, federation dispatch
- All auth failures: missing userId, null user, no role, missing org
- All security rejections: unauthorized access attempts
- Emitted via `recordAuditEvent()` from `lib/observability/audit.ts`
- Primary sink: stdout (serverless-safe)
- Secondary sink: HTTP endpoint (when `AUDIT_HTTP_ENDPOINT` configured)
- File sink: opt-in via `AUDIT_LOG_TO_FILE=true`, skipped on serverless

### Structured Logging
Console output format: `[component] event_type detail=value`
Examples:
- `[audit] {"traceId":"...","eventType":"..."}`
- `[ledger/dbAdapter] toRecord: failed to parse payload_json for record id=... type=...`
- `[super-admin/users] clerk_fetch_failed Network error`

---

## 10. AI / LLM Governance Contract

### Model Router (`lib/llm/router.ts`)
- Tries local provider first (when `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA=true`)
- Falls back to cloud managed provider
- Each provider call MUST include traceId
- Null/undefined responses from providers MUST be treated as errors, not silently passed

### Prompt Safety
- All prompts MUST be constructed from validated, tenant-scoped inputs
- No raw user input may be interpolated into system prompts without sanitization
- LLM responses MUST be validated before storage

### Versioning
- Model ID MUST be logged with each inference call
- Prompt versions SHOULD be tracked for reproducibility

### Federation Agents
- Discovery: authenticated GET (any valid session)
- Dispatch: admin or super_admin only, POST with validated FederationTaskEnvelope
- All dispatch attempts emit audit events (success and failure)

---

## 11. Multi-Tenant Isolation Contract

### Learner Data Isolation
- All ledger reads MUST be filtered by the authenticated `user.id`
- Facilitators MAY read learner data in their cohort/org only (orgId-scoped)
- Super-admin MAY read all data (full access, all operations audited)
- Admin MAY read org-scoped data, purge org-scoped data

### Org Isolation
- `orgId` is read from Clerk session (`auth().orgId`) — not from request body
- No client-provided `orgId` should override the session-derived value
- Cross-org data access is forbidden at all layers

### Purge Semantics (INV-08 elaboration)
- `purge_before(cutoffIso)`: delete records where `updatedAtIso < cutoffIso`
  - Records WITH updatedAt == cutoffIso are PRESERVED (strict less-than)
  - All adapter layers (in-memory, SQLite, DynamoDB) MUST use identical semantics
- `delete_learner(learnerId)`: delete all records for specific learner (full erasure)

---

## 12. Release Gate Contract

### Mandatory Checks (all must pass before merge)

```bash
npm run lint                    # ESLint — zero warnings permitted
npm run typecheck               # tsc --noEmit
npm run build                   # next build (full CI gate)
npm run verify:env              # Env var presence + format
npm run verify:env-parity       # .env.example vs .env.local sync
npm run verify:role-routes      # Route access assertions
npm run verify:runtime-routes   # Runtime route file presence
npm run verify:onboarding       # Tour step selectors + flag gating
npm run verify:http-smoke       # HTTP smoke (/, /app) — local only
npm run verify:release-gate     # Aggregator (runs all of the above)
```

Current count: **16 checks** in `verify:release-gate`.

### Definition of Done
A change is complete ONLY when:
- ✅ `verify:release-gate` passes locally (16/16)
- ✅ Vercel preview deploy succeeds
- ✅ Role protections verified for touched routes
- ✅ Navigation correct for all affected roles
- ✅ Onboarding tour runs without error
- ✅ Documentation updated (SPEC_LOCK, CLAUDE.md if needed)

---

## 13. Autonomous Org Governance

See `docs/AUTONOMOUS_ORG.md` for the full agent architecture.

### Governance Hierarchy

```
ARCHITECT AGENT (authority — owns this document)
       ↓
PLANNER AGENT (strategy — detects gaps, creates issues)
       ↓
IMPLEMENTER AGENT (execution — builds minimal safe changes)
       ↓
VERIFIER AGENT (safety — independent validation, may block)
       ↓
OPERATIONS AGENT (continuity — runbooks, SLOs, compliance)
```

### Safe Evolution Loop (mandatory flow)

```
Planner detects gap → Architect approves approach
                    ↓
          Implementer builds fix
                    ↓
          Verifier validates independently
                    ↓
          Operations confirms operability
                    ↓
                  Merge
```

**No agent may bypass this flow.** Implementation without Architect approval = automatic rejection.

### Invariant Protection Priority

| Priority | Class | Action on Detection |
|----------|-------|---------------------|
| P0 | Security regression | HALT all merges, open P0 issue, Architect notified |
| P0 | Tenant isolation breach | HALT all merges, open P0 issue, Architect notified |
| P0 | Auth regression | HALT all merges, open P0 issue, Architect notified |
| P1 | Reliability gap | Open P1 issue, fix in next deploy window |
| P1 | Compliance risk | Open P1 issue, fix in next deploy window |
| P2 | Optimization opportunity | Open P2 issue, schedule in next sprint |
| P3 | Documentation gap | Open P3 issue, backlog |

### SPEC_LOCK Amendment Process

1. Implementer identifies need for spec change
2. Planner documents the change request with rationale
3. Architect reviews: approve or reject
4. If approved: Architect updates this document AND CLAUDE.md
5. All PRs referencing the amendment cite the amendment ID

---

## 14. Amendment Log

| Date | ID | Description | Approved By |
|------|----|-------------|-------------|
| 2026-02-28 | AMEND-001 | Initial SPEC_LOCK creation — formalizes all invariants from seventh-pass gap analysis and previous passes | Architect Agent (autonomous init) |
| 2026-02-28 | AMEND-002 | Added `super_admin` to route matrix (previously undocumented in spec) | Architect Agent |
| 2026-02-28 | AMEND-003 | Purge semantics formalized: strict `<` (records AT cutoff preserved) — aligns all adapters | Architect Agent |
| 2026-02-28 | AMEND-004 | Autonomous Org Governance section added — defines agent hierarchy and safe evolution loop | Architect Agent |

---

*SPEC_LOCK.md — RootWork LOS. Do not modify without Architect Agent approval.*
*Initialized: 2026-02-28 by Autonomous Engineering Organization (Eighth Pass)*
