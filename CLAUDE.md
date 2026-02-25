# CLAUDE.md — RootWork LOS

> Comprehensive reference for AI agents working on this repository. Read this before touching any code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Local Development](#3-local-development)
4. [Verification Commands](#4-verification-commands)
5. [Architecture Overview](#5-architecture-overview)
6. [User Roles — Complete Reference](#6-user-roles--complete-reference)
7. [Route Access Matrix](#7-route-access-matrix)
8. [Navigation by Role](#8-navigation-by-role)
9. [Dashboards & Screens — Implementation Status](#9-dashboards--screens--implementation-status)
10. [Onboarding Tour System](#10-onboarding-tour-system)
11. [Feature Flags](#11-feature-flags)
12. [End-to-End Gap Analysis](#12-end-to-end-gap-analysis)
13. [Key Files Reference](#13-key-files-reference)
14. [Data Models & Contracts](#14-data-models--contracts)
15. [Development Guardrails](#15-development-guardrails)
16. [PR & Commit Standards](#16-pr--commit-standards)

---

## 1. Project Overview

**RootWork LOS** is a Learning Operating System that integrates learner agency, teacher guidance, and administrator visibility in one role-aware workflow. It is built on a Next.js App Router shell (the "front door") that wraps a Vite-based legacy core (`src/`) during an active screen-by-screen migration.

**Current state (as of 2026-02-25):** Phases 1–6 execution complete. All 30 atomic tickets (#45–#74) closed. Remaining work is stabilization polish.

**"First 60 Seconds" user scenario (must always pass):**
1. Visit `/` → click "Start as Independent Learner"
2. Sign up/log in → onboarding tour launches
3. Land on `/app` (PLE) → draft a mission → move to `/app/studio`
4. Save artifact → see verification summary

---

## 2. Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js App Router | 15.2.4 |
| Language | TypeScript | ~5.8.2 |
| UI | Tailwind CSS | 3.4.17 |
| Auth | Clerk | @clerk/nextjs 6.31.6 |
| Animation | Motion | 12.23.24 |
| Icons | Lucide React | 0.546.0 |
| LLM | @google/genai (Gemini) | 1.29.0 |
| Database | better-sqlite3 | 12.4.1 |
| Testing | Playwright | 1.58.2 |
| Deploy | Vercel | — |

---

## 3. Local Development

```bash
# Install dependencies
npm install

# Copy env baseline
cp .env.example .env.local

# Fill in Clerk keys and desired feature flags in .env.local

# Run dev server (port 3000)
npm run dev
```

**Minimum required env vars to boot:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
All feature flags default to `false` if unset — this is safe and intentional.

---

## 4. Verification Commands

Run these on every PR before merging. All must pass.

```bash
npm run lint                    # ESLint (app, components, lib, scripts, middleware.ts)
npm run typecheck               # tsc --noEmit
npm run build                   # next build (full CI gate)
npm run verify:env              # Env var presence + format checks
npm run verify:env-parity       # .env.example vs .env.local parity
npm run verify:role-routes      # Route access contract assertions
npm run verify:runtime-routes   # Runtime route presence checks
npm run verify:onboarding       # Tour step selectors + flag gating
npm run verify:http-smoke       # HTTP endpoint smoke (/, /app)
npm run verify:release-gate     # Full aggregated release gate (runs all of the above)
```

**Additional verification (release candidates only):**
```bash
npm run verify:role-e2e         # Requires E2E_* credentials in .env.local
npm run verify:engine-smoke     # Hybrid engine API checks
npm run verify:webhook-contract # Clerk webhook signature validation
npm run verify:security-checklist
npm run verify:branch-policy
npm run verify:swarm-overlap    # File-overlap conflict detection for parallel PRs
```

**Known non-blocking lint warnings (pre-existing):**
- 2 `react-hooks/exhaustive-deps` warnings in `PLEHome` and `StudioWorkspace` — do not suppress with eslint-disable; fix in a dedicated chore ticket.

---

## 5. Architecture Overview

```
/                  → Landing page (public, app/page.tsx)
/sign-in           → Clerk auth
/sign-up           → Clerk auth
/app/*             → Protected by middleware (Clerk auth.protect())
  └── layout.tsx   → AppShell (nav + onboarding) wraps all /app/* routes
```

**Middleware** (`middleware.ts`): All `/app(.*)` routes require Clerk session. Graceful fallback to `/sign-in?auth=unavailable` when Clerk key is missing. Every response carries a trace ID header (`X-Trace-Id`).

**Role assignment**: Stored in Clerk `publicMetadata.role`. All role decisions flow from `lib/auth/roles.ts` → `lib/auth/routeAccess.ts`. No ad hoc role logic anywhere else.

**Feature flags**: Read at module load from `process.env`. All flags default safe (false). Two sets: Phase 1 flags (`lib/config/featureFlags.ts#phase1FeatureFlags`) and Phase 3 flags (`#phase3FeatureFlags`).

**Ownership lanes (no-overlap rule):**

| Lane | Files | Owner |
|------|-------|-------|
| A — Auth/Security | `lib/auth/*`, `middleware.ts`, `app/sign-*`, `docs/security/*` | — |
| B — Shell/Nav/Onboarding | `components/app-shell/*`, `lib/nav/*`, `lib/onboarding/*`, `app/app/layout.tsx` | — |
| C — Runtime/Ledger/Standards | `lib/runtime/*`, `lib/ledger/*`, `lib/standards/*`, `components/studio/*` | — |
| D — Cloud/Federation | `lib/orchestration/*`, `lib/federation/*`, `app/api/federation/*`, `infra/*` | — |
| E — CI/Release/Docs | `.github/*`, `scripts/*`, `docs/*`, `README.md` | — |

**Never edit `app/app/layout.tsx` in parallel PRs.** This is a hard guardrail.

---

## 6. User Roles — Complete Reference

Six roles are defined in `lib/auth/roles.ts`:

```typescript
export const APP_ROLES = [
  "student_independent",
  "student_enrolled",
  "adult_learner",
  "teacher",
  "professional_development",
  "admin",
] as const;
```

Role groupings (used in route access contracts):

| Group | Roles |
|-------|-------|
| `LEARNER_ROLES` | student_independent, student_enrolled, adult_learner |
| `FACILITATOR_ROLES` | teacher, professional_development |
| `ADMIN_ROLE` | admin |
| `ALL_ROLES` | all six |

### Role Requirements

| Role | Clerk org required? | Notes |
|------|---------------------|-------|
| student_independent | No | Self-enrolled learner |
| student_enrolled | No | Classroom learner (org check pending — see gaps) |
| adult_learner | No | Adult professional learning pathway |
| teacher | **Yes** — `orgId` required | Blocked at layout if no org |
| professional_development | **Yes** — `orgId` required | Blocked at layout if no org |
| admin | **Yes** — `orgId` required | Blocked at layout if no org |

### Role-to-Home Dashboard Mapping

| Role | Home Component | Status |
|------|---------------|--------|
| student_independent | `PLEHome` | ✅ Implemented |
| student_enrolled | `PLEHome` | ✅ Implemented |
| adult_learner | `AdultLearnerHome` | ✅ Implemented |
| teacher | `PLEHome` | ⚠️ **GAP** — falls through to student UI |
| professional_development | `ProfessionalDevelopmentHome` | ✅ Implemented |
| admin | `PLEHome` | ⚠️ **GAP** — falls through to student UI |

> **Critical gap**: `teacher` and `admin` currently render `PLEHome` because `app/app/page.tsx` has no branch for these roles. Both need dedicated home dashboards.

---

## 7. Route Access Matrix

Defined in `lib/auth/routeAccess.ts`. This is the **single source of truth** — all changes must update this file AND `docs/qa/role-matrix.md` together.

| Route | si | se | al | tc | pd | ad | Notes |
|-------|----|----|----|----|----|----|----|
| `/app` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Role-specific home |
| `/app/profile` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Inline in catch-all |
| `/app/core` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Flag-gated bridge |
| `/app/missions` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Learner only |
| `/app/studio` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Learner only |
| `/app/portfolio` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Learner only |
| `/app/credentials` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Learner only |
| `/app/settings` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Learner only |
| `/app/command-center` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | Facilitator only |
| `/app/cohorts` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | Facilitator only |
| `/app/pickups` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | Facilitator only |
| `/app/reviews` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | Facilitator only |
| `/app/builder` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | Facilitator only |
| `/app/standards` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Admin only |
| `/app/evidence` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Admin only |
| `/app/exports` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Admin only |
| `/app/forbidden` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | In-app 403 view |

**Column key:** si=student_independent, se=student_enrolled, al=adult_learner, tc=teacher, pd=professional_development, ad=admin

**Legacy redirects** (handled in `routeAccess.ts`):
- `/app/home` → `/app`
- `/app/ple` → `/app`
- `/app/create` → `/app/studio`

---

## 8. Navigation by Role

Defined in `lib/nav/items.ts`. Every role gets its own `readonly NavItem[]` — no shared list with filtering.

| Role | Nav Items |
|------|-----------|
| student_independent | Home (PLE), Missions, Studio, Portfolio, Credentials, Settings, Core, Profile |
| student_enrolled | Home (PLE), Missions, Studio, Portfolio, Credentials, Settings, Core, Profile |
| adult_learner | Home (Adult), Missions, Studio, Portfolio, Credentials, Settings, Core, Profile |
| teacher | Home, Command Center, Cohorts, Pickups, Reviews, Builder, Core, Profile |
| professional_development | Home (PD), Command Center, Cohorts, Pickups, Reviews, Builder, Core, Profile |
| admin | Home, Standards, Evidence, Exports, Core, Profile |

**AppShell** (`components/app-shell/AppShell.tsx`): Renders sticky header (role label, user name, Help menu), responsive sidebar nav (`data-tour="primary-nav"`), mobile menu toggle, and main content area. The `data-tour="help-menu"` button fires `rootwork:restart-tour` custom event to restart the onboarding tour.

---

## 9. Dashboards & Screens — Implementation Status

### Learner Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| PLE Home | `/app` | `components/ple/PLEHome.tsx` | ✅ Implemented | Mission draft, runtime events, localStorage persistence |
| Adult Learner Home | `/app` (al role) | `components/dashboards/AdultLearnerHome.tsx` | ✅ Implemented | Goal, studio, progress cards |
| Studio | `/app/studio` | `components/studio/StudioWorkspace.tsx` | ✅ Implemented | Artifact editor, ledger save, standards verification |
| Credentials | `/app/credentials` | `components/credentials/CredentialsSummary.tsx` | ✅ Implemented | Counts from ledger (flag-gated) |
| Settings | `/app/settings` | `components/settings/SettingsHealth.tsx` | ✅ Implemented | Flag health checks |
| Missions | `/app/missions` | catch-all placeholder | ⚠️ Placeholder | No dedicated component or mission list UI |
| Portfolio | `/app/portfolio` | catch-all placeholder | ⚠️ Placeholder | No dedicated component |

### Facilitator Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| PD Home | `/app` (pd role) | `components/dashboards/ProfessionalDevelopmentHome.tsx` | ✅ Implemented | Session pipeline, reviews, cohort health |
| Teacher Home | `/app` (teacher role) | `PLEHome` (wrong) | ❌ **GAP** | Teacher should NOT see PLE |
| Command Center | `/app/command-center` | catch-all placeholder | ⚠️ Placeholder | — |
| Cohorts | `/app/cohorts` | catch-all placeholder | ⚠️ Placeholder | — |
| Pickups | `/app/pickups` | catch-all placeholder | ⚠️ Placeholder | Feature flag `NEXT_PUBLIC_ENABLE_PICKUP` exists |
| Reviews | `/app/reviews` | catch-all placeholder | ⚠️ Placeholder | — |
| Builder | `/app/builder` | catch-all placeholder | ⚠️ Placeholder | — |

### Admin Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| Admin Home | `/app` (admin role) | `PLEHome` (wrong) | ❌ **GAP** | Admin should NOT see PLE |
| Evidence | `/app/evidence` | `components/evidence/AdminEvidenceView.tsx` | ✅ Implemented | Ledger record viewer (flag-gated) |
| Exports | `/app/exports` | `components/exports/ExportReadiness.tsx` | ✅ Implemented | Readiness summary |
| Standards | `/app/standards` | catch-all placeholder | ⚠️ Placeholder | — |

### System / Shared Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| Landing | `/` | `app/page.tsx` | ✅ Implemented | Three role CTAs (learner, teacher, admin) |
| Profile | `/app/profile` | inline in catch-all | ✅ Implemented | Shows role + orgId |
| Core Mount | `/app/core` | `app/app/core/page.tsx` → `CoreMountRuntimeLoader` | ✅ Implemented | Flag-gated via `createCoreMountRuntime()` + dedicated page |
| Forbidden | `/app/forbidden` | `components/app-shell/ForbiddenPanel.tsx` | ✅ Implemented | In-app 403 view |
| Sign In | `/sign-in` | Clerk UI | ✅ Implemented | — |
| Sign Up | `/sign-up` | Clerk UI | ✅ Implemented | — |

---

## 10. Onboarding Tour System

**Files:** `lib/onboarding/tourSteps.ts`, `lib/onboarding/resolveSteps.ts`, `components/onboarding/OnboardingTour.tsx`

**Behavior:**
- Tour auto-starts on first login per role (localStorage key: `rootwork.tour.completed.{role}`)
- Steps filtered by feature flags at runtime via `resolveTourSteps()`
- DOM elements highlighted with `ring-2 ring-sky-500 ring-offset-2`
- Steps skipped if their `selector` is not found in DOM (safe — no crashes)
- Restart via Help menu → fires `rootwork:restart-tour` custom event

**Tour steps by role:**

| Role | Steps | Data-tour selectors used |
|------|-------|--------------------------|
| student_independent | 9 | primary-nav, page-title, mission-draft, mission-actions, studio-entry, artifact-save, verification-summary, help-menu, core-mount |
| student_enrolled | 4 | primary-nav, page-title, help-menu, core-mount |
| adult_learner | 5 | primary-nav, page-title, mission-draft, studio-entry, help-menu |
| teacher | 3 | primary-nav, page-title, help-menu |
| professional_development | 3 | primary-nav, page-title, help-menu |
| admin | 3 | primary-nav, page-title, help-menu |

**Flag-gated steps:**
- `core-mount` step (student_independent, student_enrolled): requires `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT=true`

**Tour gaps:**
- Teacher and admin tours have only 3 generic steps — no role-specific content
- No tour steps for command-center, cohorts, reviews, builder, standards screens

---

## 11. Feature Flags

All flags are read at module-load time from `process.env`. Default to `false` if not set. Never crash when disabled — always degrade gracefully.

### Phase 1 Flags (`lib/config/featureFlags.ts#phase1FeatureFlags`)

| Flag | Default | Purpose | Status |
|------|---------|---------|--------|
| `NEXT_PUBLIC_ENABLE_LEDGER` | false | Enables local ledger persistence in Studio/Credentials/Evidence | ✅ Wired |
| `NEXT_PUBLIC_ENABLE_MCP` | false | MCP integration | ⚠️ **GAP** — flag exists, no implementation |
| `NEXT_PUBLIC_ENABLE_PICKUP` | false | Pickups feature in facilitator nav | ⚠️ **GAP** — Pickups is placeholder only |
| `NEXT_PUBLIC_ENABLE_OFFLINE` | false | Offline mode | ⚠️ **GAP** — flag exists, no implementation |
| `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT` | false | Shows legacy core bridge at `/app/core` | ✅ Wired |

### Phase 3 Flags (`lib/config/featureFlags.ts#phase3FeatureFlags`)

| Flag | Default | Purpose | Status |
|------|---------|---------|--------|
| `NEXT_PUBLIC_ENABLE_RUNTIME` | false | Activates runtime event dispatch (mission lifecycle) | ✅ Wired |
| `NEXT_PUBLIC_ENABLE_LEDGER` | false | (shared with Phase 1) | ✅ Wired |
| `NEXT_PUBLIC_ENABLE_DB_LEDGER` | false | DB-backed ledger via SQLite adapter | ⚠️ **GAP** — contract exists, no SQLite wiring |
| `NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER` | false | Keyword-based standards verification in Studio | ✅ Wired |

### Phase 4 Flags (env only, no featureFlags.ts constant group)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA` | false | Local Ollama LLM provider |
| `NEXT_PUBLIC_ENABLE_FEDERATION` | false | Agent federation gateway |

---

## 12. End-to-End Gap Analysis

This section documents every known gap between the product spec and the current implementation, ranked by severity.

### 🔴 Critical Gaps (wrong UX / broken role experience)

#### GAP-01: Teacher home shows student PLE UI
- **File:** `app/app/page.tsx:20`
- **Issue:** `teacher` role has no branch in home page logic. Falls through to `<PLEHome />` — a student screen with mission drafts and studio entry.
- **Expected:** A `TeacherHome` dashboard component showing Command Center summary, active cohorts, review queue snapshot.
- **Fix:** Add `if (role === "teacher") return <TeacherHome />;` and create `components/dashboards/TeacherHome.tsx`.

#### GAP-02: Admin home shows student PLE UI
- **File:** `app/app/page.tsx:20`
- **Issue:** `admin` role has no branch in home page logic. Falls through to `<PLEHome />`.
- **Expected:** An `AdminHome` dashboard component showing standards summary, evidence volume, export readiness.
- **Fix:** Add `if (role === "admin") return <AdminHome />;` and create `components/dashboards/AdminHome.tsx`.

### 🟠 High-Priority Gaps (placeholder screens with no content)

#### GAP-03: Missions screen — no implementation
- **Route:** `/app/missions`
- **Current:** Generic catch-all placeholder ("Placeholder for the Missions experience.")
- **Expected:** Mission list, launch flow, mission lifecycle actions (start, submit).
- **Missing:** `components/missions/` directory, dedicated `app/app/missions/page.tsx`.

#### GAP-04: Portfolio screen — no implementation
- **Route:** `/app/portfolio`
- **Current:** Generic catch-all placeholder.
- **Expected:** Evidence portfolio view, artifact gallery, credential progress.
- **Missing:** `components/portfolio/` directory, dedicated `app/app/portfolio/page.tsx`.

#### GAP-05: Command Center — no implementation
- **Route:** `/app/command-center`
- **Current:** Generic catch-all placeholder.
- **Expected:** Teacher/PD operational dashboard (active cohorts, pickup queue, review backlog).
- **Missing:** `components/command-center/` directory, dedicated `app/app/command-center/page.tsx`.

#### GAP-06: Cohorts — no implementation
- **Route:** `/app/cohorts`
- **Current:** Generic catch-all placeholder.
- **Expected:** Cohort list with learner counts, assignment controls.
- **Missing:** `components/cohorts/` directory.

#### GAP-07: Reviews — no implementation
- **Route:** `/app/reviews`
- **Current:** Generic catch-all placeholder.
- **Expected:** Artifact review queue, verdict submission (approve/return/flag).
- **Missing:** `components/reviews/` directory.

#### GAP-08: Standards — no implementation
- **Route:** `/app/standards`
- **Current:** Generic catch-all placeholder.
- **Expected:** Standards registry admin view, plugin config.
- **Missing:** `components/standards/` directory.

#### GAP-09: Builder — no implementation
- **Route:** `/app/builder`
- **Current:** Generic catch-all placeholder. Feature flag `NEXT_PUBLIC_ENABLE_PICKUP` exists but is unrelated.
- **Expected:** Mission/cohort builder for facilitators.
- **Missing:** `components/builder/` directory.

#### GAP-10: Pickups — no implementation behind flag
- **Route:** `/app/pickups`
- **Current:** Generic placeholder. `NEXT_PUBLIC_ENABLE_PICKUP` flag defined but not checked anywhere in pickups route.
- **Expected:** When flag on: pickup assignment UI. When flag off: disabled message.
- **Missing:** `components/pickups/` directory, flag gate in route.

### 🟡 Medium-Priority Gaps (contracts exist, no wiring)

#### GAP-11: DB Ledger implemented but never selected
- **File:** `lib/ledger/dbAdapter.ts`
- **Issue:** `createDbLedgerAdapter()` is a **fully functional SQLite implementation** — it opens a real DB file, creates the `ledger_records` table, and has prepared statements for `readAll`, `upsert` (with `ON CONFLICT`), and `findByMission`. A `shouldUseDbLedger()` helper also exists and reads the flag. However, no consumer ever calls `shouldUseDbLedger()` — `StudioWorkspace`, `CredentialsSummary`, and `AdminEvidenceView` all import `localLedgerAdapter` directly and unconditionally. Enabling `NEXT_PUBLIC_ENABLE_DB_LEDGER=true` currently has no effect.
- **Fix:** In each ledger consumer, replace the direct `localLedgerAdapter` import with a conditional: `shouldUseDbLedger() ? createDbLedgerAdapter() : localLedgerAdapter`.

#### GAP-12: Dead code in catch-all for `/app/core` and `/app/forbidden`
- **File:** `app/app/[[...slug]]/page.tsx:40-88`
- **Issue:** The catch-all contains explicit handling blocks for `/app/core` (static text, lines 68-88) and `/app/forbidden` (lines 40-42), but **dedicated pages take Next.js App Router priority**: `app/app/core/page.tsx` and `app/app/forbidden/page.tsx` both exist and are the actual handlers. The catch-all branches are unreachable dead code.
- **Note:** `CoreMountRuntime.tsx` and `CoreMountRuntimeLoader.tsx` ARE properly wired — `app/app/core/page.tsx` imports and uses them correctly via `createCoreMountRuntime()`.
- **Fix:** Remove the `/app/core` and `/app/forbidden` handling blocks from the catch-all to eliminate confusion.

#### GAP-13: MCP integration missing
- **Issue:** `NEXT_PUBLIC_ENABLE_MCP=true` flag has no corresponding implementation, component, API route, or UI entry point.
- **Fix:** Define the MCP integration contract before implementation; create a dedicated ticket.

#### GAP-14: Offline mode missing
- **Issue:** `NEXT_PUBLIC_ENABLE_OFFLINE=true` flag has no corresponding implementation (service worker, offline ledger sync, etc.).
- **Fix:** Define the offline contract before implementation; create a dedicated ticket.

#### GAP-22: LLM routing layer never instantiated
- **Files:** `lib/llm/router.ts`, `lib/llm/providers/localOllama.ts`, `lib/llm/providers/cloudManaged.ts`
- **Issue:** `ModelRouter`, `LocalOllamaProvider`, and `CloudManagedProvider` are fully typed and implemented but **no API route or component ever instantiates or calls them**. The entire LLM routing layer is a disconnected island — enabling `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA` or configuring AWS does nothing visible in the app.
- **Sub-issue:** `LocalOllamaProvider.infer()` calls `buildFallbackResponse()` with `usedFallback: false` even when the provider is disabled. This means if `ModelRouter` were ever wired up, a disabled Ollama provider would appear to "succeed," preventing the router from triggering cloud fallback.
- **Fix:** Create an API route (e.g. `app/api/infer/route.ts`) that instantiates `ModelRouter` with the configured providers, then wire it to a UI entry point (e.g. studio AI assist). Fix `LocalOllamaProvider` to return `usedFallback: true` when disabled.

#### GAP-23: Orchestration queue never instantiated
- **Files:** `lib/orchestration/queueAdapter.ts`, `lib/orchestration/workerRunner.ts`, `lib/orchestration/stateMachine.ts`
- **Issue:** `InMemoryQueueAdapter` and `runWorkerLifecycle` are fully implemented (priority sorting, idempotency keying, retry logic, deterministic state machine) but **no API route or background job ever creates an instance or enqueues work**. The orchestration system runs nowhere.
- **Fix:** Create at minimum an API route that accepts job submissions and a worker invocation path. Long-term: back the adapter with SQS as contracted in `infra/aws-baseline.json`.

#### GAP-24: Audit log writes to disk — broken in serverless
- **File:** `lib/observability/audit.ts`
- **Issue:** `recordAuditEvent()` uses `appendFileSync` to write NDJSON to `docs/status/audit-log.ndjson` via a **synchronous filesystem write** to a project-relative path. In Vercel's serverless runtime the project directory is read-only — these writes fail silently, and any writes that do succeed on a local/container run are ephemeral and lost on the next deploy. The audit trail (federation events, webhook events) is never actually persisted in production.
- **Fix:** Replace `appendFileSync` with an append to a durable store — at minimum a writable path like `/tmp` for local dev, and a real append destination (DynamoDB, logging service, or Vercel Log Drains) for production.

#### GAP-25: Clerk webhook handler discards event payload
- **File:** `app/api/webhooks/clerk/route.ts`
- **Issue:** The HMAC signature verification is correctly implemented using `timingSafeEqual`. However, after accepting the verified webhook, the handler **does nothing with the body** — it reads it only for signature verification, then returns `{ ok: true }`. No `user.created`, `user.updated`, or `session.created` events are processed. Role changes in Clerk do not propagate to any app-side record or cache.
- **Fix:** Parse the webhook event type and payload, then handle relevant events (e.g. sync `publicMetadata.role` changes to a server-side store, invalidate role caches).

#### GAP-26: Standards plugin architecture defined but bypassed
- **File:** `lib/standards/contracts/plugins.ts`
- **Issue:** `createRulePlugin()` and `runStandardsPlugins()` implement a complete plugin dispatch system for standards verification. However, `StudioWorkspace` calls `verifyArtifactText()` directly from `lib/standards/verifier/localVerifier.ts`, which internally calls `keywordStandardsRule` without going through the plugin registry. The plugin system is fully coded but never invoked anywhere.
- **Fix:** Wire `runStandardsPlugins()` into the verification call in `StudioWorkspace`, replacing the direct `verifyArtifactText()` call, so that additional plugins can be registered and composed.

### 🟢 Low-Priority Gaps (polish / UX improvements)

#### GAP-15: Landing page CTA differentiation
- **File:** `app/page.tsx`
- **Issue:** "Teacher Login" and "Admin Info" both route to `/sign-in`. No role-prefill or separate onboarding paths.
- **Expected:** Teacher/admin CTAs should either pre-set a role hint or route to dedicated onboarding.

#### GAP-16: Teacher & admin onboarding tours are minimal
- **File:** `lib/onboarding/tourSteps.ts`
- **Issue:** Teacher and admin tours have only 3 generic steps (nav, home, help). No steps for command-center, cohorts, reviews, standards.
- **Fix:** Add role-specific steps once those screens exist.

#### GAP-17: student_enrolled org check not enforced
- **File:** `app/app/layout.tsx:32`
- **Issue:** `student_enrolled` role is not in the org-required check (only teacher, professional_development, admin). Enrolled students belong to classrooms — they may need org validation too.
- **Fix:** Confirm product decision; if org required for enrolled students, add to check.

#### GAP-18: React hook dependency warnings
- **Files:** `components/ple/PLEHome.tsx`, `components/studio/StudioWorkspace.tsx`
- **Issue:** 2 `react-hooks/exhaustive-deps` ESLint warnings (non-blocking but add review noise).
- **Fix:** Wrap dependent values in `useCallback`/`useMemo` as appropriate.

#### GAP-19: Legacy Vite core (`src/`) migration incomplete
- **Files:** `src/App.tsx`, `src/main.tsx`, `src/services/geminiService.ts`
- **Issue:** The Vite core exists in `src/` and `vite.config.ts` is present but the migration path to Next.js routes is only partially defined.
- **Fix:** Screen-by-screen migration per Phase 2 cutover doc (`docs/phase2-cutover.md`).

#### GAP-20: `docs/qa/role-matrix.md` incomplete — 6 routes missing
- **File:** `docs/qa/role-matrix.md`
- **Issue:** The QA matrix only documents 12 routes, but `lib/auth/routeAccess.ts` defines 17 routes. Six are absent from the matrix:
  - `/app/portfolio`
  - `/app/pickups`
  - `/app/builder`
  - `/app/standards`
  - `/app/exports`
  - `/app/forbidden`
- **Fix:** Add the 6 missing rows to `docs/qa/role-matrix.md` and run `verify:role-routes` to confirm parity.

#### GAP-21: No sign-out button in AppShell
- **File:** `components/app-shell/AppShell.tsx`
- **Issue:** The shell header shows role label and user name but has no sign-out link or button. Users authenticated via Clerk have no in-app path to log out. The Help `<details>` menu only contains "Restart tour". Signing out currently requires the user to navigate to `/sign-in` manually or clear their session.
- **Fix:** Add a Clerk `<SignOutButton>` (or equivalent redirect to `/sign-in`) inside the Help menu or as a standalone header control.

#### GAP-27: Data retention and deletion hooks never triggered
- **Files:** `lib/ledger/adapter.ts`, `lib/runtime/engine/store.ts`
- **Issue:** Four data lifecycle functions exist but nothing calls them:
  - `purgeLedgerRecordsBefore(cutoffIso)` — time-based ledger retention
  - `deleteLedgerRecordsByLearner(learnerId)` — GDPR-style learner deletion from ledger
  - `purgeRuntimeStateBefore(cutoffIso)` — runtime state retention
  - `deleteRuntimeStateByLearner(learnerId)` — GDPR-style runtime state deletion
  No UI, API endpoint, admin screen, or scheduled job invokes any of these. The data retention/right-to-erasure mechanism is implemented but completely unconnected.
- **Fix:** Wire to an admin API endpoint and/or an admin UI control in the Standards or Evidence screens.

#### GAP-28: Standards registry is hardcoded — no admin path to configure
- **File:** `lib/standards/verifier/localVerifier.ts`
- **Issue:** `DEFAULT_STANDARDS` contains exactly 2 hardcoded standards (`rw.mission.clarity`, `rw.artifact.reflection`) with keyword sets. The `/app/standards` admin screen is a placeholder. There is no way for an admin to add, modify, disable, or weight standards through the UI. The plugin architecture (`plugins.ts`) exists but is also bypassed (see GAP-26).
- **Fix:** Implement the Standards admin screen to read/write a standards registry; connect it to the verifier and plugin system.

#### GAP-29: Federation dispatch is a stub — tasks accepted but never routed
- **File:** `app/api/federation/route.ts`
- **Issue:** The federation POST endpoint validates the flag, validates the task envelope, and returns `{ accepted: true }` — but it never actually dispatches the task to any agent. No agent registry lookup occurs, no capability matching runs, `buildCapabilityIndex` from `registryContracts.ts` is never called, and there is no GET endpoint for agent discovery. The federation control plane accepts work but does nothing with it.
- **Fix:** Implement agent registry persistence, capability routing via `buildCapabilityIndex`, and actual task dispatch. Add a GET endpoint for agent discovery.

---

## 13. Key Files Reference

### Authentication & Authorization

| File | Purpose |
|------|---------|
| `lib/auth/roles.ts` | `APP_ROLES` constant and `AppRole` type |
| `lib/auth/userRole.ts` | `parseAppRole()` type guard |
| `lib/auth/currentRole.ts` | `getCurrentAppRole()` — async, server-only |
| `lib/auth/routeAccess.ts` | Route definitions, access control functions, legacy redirects |
| `middleware.ts` | Clerk auth protection, trace ID propagation |

### Navigation & Shell

| File | Purpose |
|------|---------|
| `lib/nav/items.ts` | `NAV_ITEMS_BY_ROLE` per-role nav definitions |
| `components/app-shell/AppShell.tsx` | Main UI shell (header, sidebar, mobile menu) |
| `components/app-shell/ForbiddenPanel.tsx` | 403 access restricted UI |

### Dashboards

| File | Purpose |
|------|---------|
| `components/ple/PLEHome.tsx` | Student learner home (si, se) |
| `components/dashboards/AdultLearnerHome.tsx` | Adult learner home |
| `components/dashboards/ProfessionalDevelopmentHome.tsx` | PD facilitator home |
| *(missing)* | TeacherHome — **GAP-01** |
| *(missing)* | AdminHome — **GAP-02** |

### Core App Routes

| File | Purpose |
|------|---------|
| `app/page.tsx` | Public landing page |
| `app/app/layout.tsx` | Protected shell layout (auth check, role extraction, nav, onboarding) |
| `app/app/page.tsx` | Home route — dispatches to role-specific dashboard |
| `app/app/[[...slug]]/page.tsx` | Catch-all for unimplemented routes (placeholder + profile inline) — has dead branches for `/app/core` and `/app/forbidden` (see GAP-12) |
| `app/app/core/page.tsx` | Core mount route — `createCoreMountRuntime()` + `CoreMountRuntimeLoader` (dedicated, takes App Router priority) |
| `app/app/forbidden/page.tsx` | In-app 403 route — renders `ForbiddenPanel` directly (dedicated page) |
| `app/app/studio/page.tsx` | Studio route (role guard + StudioWorkspace) |
| `app/app/credentials/page.tsx` | Credentials route |
| `app/app/evidence/page.tsx` | Evidence route |
| `app/app/exports/page.tsx` | Exports route |
| `app/app/settings/page.tsx` | Settings route |

### Runtime & Ledger

| File | Purpose |
|------|---------|
| `lib/runtime/contracts/types.ts` | RuntimeMission, RuntimeArtifact, VerificationEvent types |
| `lib/runtime/engine/store.ts` | `readRuntimeState()`, `writeRuntimeState()`, `dispatchRuntimeEvent()` |
| `lib/runtime/engine/reducer.ts` | Event reducer for mission/artifact/verification lifecycle |
| `lib/ledger/adapter.ts` | Local in-memory ledger with localStorage persistence |
| `lib/ledger/dbAdapter.ts` | SQLite adapter contract (not yet wired — GAP-11) |
| `lib/coreState/session.ts` | CoreSessionState merge functions |

### Onboarding

| File | Purpose |
|------|---------|
| `lib/onboarding/tourSteps.ts` | `ROLE_TOUR_STEPS` — all steps per role |
| `lib/onboarding/resolveSteps.ts` | `resolveTourSteps()` — filters by feature flags |
| `components/onboarding/OnboardingTour.tsx` | Tour UI component |

### Configuration

| File | Purpose |
|------|---------|
| `lib/config/featureFlags.ts` | Phase 1 and Phase 3 flag readers |
| `lib/config/envGuards.ts` | `getConfiguredPublishableKey()`, `sanitizePublicUrl()` |
| `.env.example` | Authoritative env var contract — keep in sync with new flags |

### API Routes

| File | Purpose |
|------|---------|
| `app/api/health/route.ts` | Health check (`GET /api/health`) |
| `app/api/federation/route.ts` | Federation task acceptance (feature-gated) |
| `app/api/webhooks/clerk/route.ts` | Clerk user sync webhook with HMAC validation |

### Standards & Federation

| File | Purpose |
|------|---------|
| `lib/standards/contracts/types.ts` | StandardDescriptor, VerificationRuleResult |
| `lib/standards/verifier/localVerifier.ts` | Keyword-based verification |
| `lib/federation/types.ts` | Federation envelope types |
| `lib/federation/protocol.ts` | v1 protocol creators |
| `lib/observability/audit.ts` | `recordAuditEvent()` → `docs/status/audit-log.ndjson` |
| `lib/observability/trace.ts` | Trace ID utilities |

---

## 14. Data Models & Contracts

### User Role Assignment
Stored in **Clerk `publicMetadata.role`** as a plain string. Must match an `AppRole` value exactly.

```typescript
// Reading server-side
const user = await currentUser();
const role = parseAppRole(user?.publicMetadata?.role); // returns AppRole | null
```

### RuntimeMission (in-memory / localStorage)
```typescript
{ id, learnerId, title, stage: "not_started"|"in_progress"|"submitted"|"verified", updatedAtIso }
```

### RuntimeArtifact
```typescript
{ id, missionId, learnerId, content, updatedAtIso }
```

### VerificationEvent
```typescript
{ id, missionId, artifactId, standards: string[], verdict: "pass"|"partial"|"missing", createdAtIso }
```

### LedgerRecord
```typescript
{ id, type: "mission"|"artifact"|"verification", missionId, learnerId, payload: unknown, createdAtIso, updatedAtIso }
```

### AuditEvent
```typescript
{ traceId, eventType, role, orgId, actorId, severity: "info"|"warning"|"error", metadata, createdAtIso }
```

### OrchestrationJobEnvelope
```typescript
{ jobId, idempotencyKey, status, attempt, priority, retryPolicy, payload, lastErrorCode?, lastErrorMessage? }
```

### FederationTaskEnvelope
```typescript
{ taskId, correlationId, requestedByRole, assignedAgentId, capabilityId, payload }
```

---

## 15. Development Guardrails

These are non-negotiable — enforcement is automated by verifier scripts and CI.

1. **Contract before implementation.** For any auth/routes/flags/onboarding/federation changes: define the interface in `lib/` first (types + constants), then implement.

2. **No parallel PRs may edit `app/app/layout.tsx`** or `app/layout.tsx`. Use the `verify:swarm-overlap` script.

3. **Max 15 files changed per PR** unless explicitly documented in the PR description.

4. **Every new env var must be added to `.env.example`** with a comment.

5. **Every route addition must update:**
   - `lib/auth/routeAccess.ts` (APP_ROUTE_DEFINITIONS)
   - `docs/qa/role-matrix.md`
   - `lib/nav/items.ts` (if it appears in navigation)
   - `scripts/verify-role-routes.mjs` (if needed)

6. **Feature flags default safe.** When a flag is `false`, the UI must never crash — show a graceful disabled message.

7. **Tours must not crash** when `data-tour` selectors are missing. The `OnboardingTour` component already skips missing selectors — keep it that way.

8. **No new frameworks** without an explicit ticket authorization.

9. **No ad hoc role logic.** All role/route decisions flow from `lib/auth/routeAccess.ts`. No inline `user.role === "admin"` checks scattered across components.

10. **Do not introduce hidden magic behavior.** Every routing, role, and flag decision must be explicit and traceable to a contract.

---

## 16. PR & Commit Standards

### PR Title Format
```
[#ISSUE] Short scope summary
```
Example: `[#75] Add TeacherHome dashboard component`

### PR Must Include
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm run verify:role-routes` passes
- [ ] `npm run verify:onboarding` passes
- [ ] How to test locally (commands + routes)
- [ ] Screenshots/GIF if UI changed
- [ ] New env vars documented in `.env.example`

### PR Must NOT
- Edit `app/app/layout.tsx` in parallel with another open PR
- Touch more than 15 files unless documented
- Introduce a new framework without ticket authorization
- Skip hooks or bypass TypeScript
- Add duplicate code instead of using existing contracts

### Definition of Done
A change is done only when:
- ✅ `npm run verify:release-gate` passes locally
- ✅ Vercel preview deploy succeeds
- ✅ Role protections work for the touched routes
- ✅ Navigation renders correctly for each affected role
- ✅ Onboarding tour runs without error
- ✅ Documentation updated

---

*Last updated: 2026-02-25 — Third pass: backend gaps #92–#96 resolved. Full static E2E audit by role complete (94/98 checks pass; 98% after federation auth fix).*

### Resolved gaps (this session)
- **GAP-15** ✅ Landing CTAs fixed: Teacher Login → `/sign-in?role=teacher`, Admin Login → `/sign-in?role=admin` (was 404 `/admin-info`). Sign-in shows role-contextual note.
- **GAP-22** ✅ LLM routing wired: `POST /api/inference` instantiates `ModelRouter` with LocalOllama + CloudManaged providers.
- **GAP-23** ✅ Orchestration typed dispatch: `lib/orchestration/jobTypes.ts` + `worker-run` dispatches `standards.verify` and `runtime.smoke` jobs.
- **GAP-24** ✅ Audit log serverless-safe (console emit + opt-in file sink with AUDIT_LOG_TO_FILE).
- **GAP-25** ✅ Clerk webhook syncs role changes from `user.created`/`user.updated`.
- **GAP-26** ✅ Standards plugin wired: Studio calls `runDefaultStandardsPlugins()` through the plugin registry.
- **GAP-27** ✅ Data retention endpoints: `DELETE /api/admin/data-retention/learner` and `/purge`. Admin-only with audit.
- **GAP-28** ✅ Standards write path live: `/app/standards` renders `StandardsManager`. `defaultPlugins` reads `readConfiguredStandards()` (SSR-safe).
- **GAP-29** ✅ Federation dispatch: POST executes tasks via `dispatchFederationTask()`, stores results. GET polls by `?taskId=`. Auth-gated.

### Remaining open (intentional deferrals)
- **GAP-13** MCP flag exists, health endpoint added — implementation awaits spec.
- **GAP-14** Offline flag exists, status endpoint added — implementation awaits spec.
- **GAP-17** `student_enrolled` org check — pending product policy decision.
- **GAP-19** Legacy Vite `src/` migration — phased, ongoing.

*Branch: `claude/gap-screens-all-RHg64`*
