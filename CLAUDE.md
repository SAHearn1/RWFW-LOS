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
- None currently. The 2 `react-hooks/exhaustive-deps` warnings in `PLEHome` and `StudioWorkspace` were resolved (GAP-18 fixed).

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
| teacher | `TeacherHome` | ✅ Implemented |
| professional_development | `ProfessionalDevelopmentHome` | ✅ Implemented |
| admin | `AdminHome` | ✅ Implemented |

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
| Missions | `/app/missions` | `components/missions/MissionsList.tsx` | ✅ Implemented | Mission list with lifecycle actions; `/api/missions` route |
| Portfolio | `/app/portfolio` | `components/portfolio/PortfolioGallery.tsx` | ✅ Implemented | Evidence portfolio, artifact gallery, credential progress |

### Facilitator Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| PD Home | `/app` (pd role) | `components/dashboards/ProfessionalDevelopmentHome.tsx` | ✅ Implemented | Session pipeline, reviews, cohort health |
| Teacher Home | `/app` (teacher role) | `components/dashboards/TeacherHome.tsx` | ✅ Implemented | Command Center summary, cohorts, review queue snapshot |
| Command Center | `/app/command-center` | `components/command-center/CommandCenterDashboard.tsx` | ✅ Implemented | Teacher/PD operational dashboard (mock data) |
| Cohorts | `/app/cohorts` | `components/cohorts/CohortsList.tsx` | ✅ Implemented | Cohort list with learner counts (mock data) |
| Pickups | `/app/pickups` | `components/pickups/PickupsPanel.tsx` | ✅ Implemented | Flag-gated (`NEXT_PUBLIC_ENABLE_PICKUP`); disabled message when flag off |
| Reviews | `/app/reviews` | `components/reviews/ReviewQueue.tsx` | ✅ Implemented | Artifact review queue, verdict submission UI (mock data) |
| Builder | `/app/builder` | `components/builder/BuilderWorkspace.tsx` | ✅ Implemented | Mission/cohort builder (mock data) |

### Admin Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| Admin Home | `/app` (admin role) | `components/dashboards/AdminHome.tsx` | ✅ Implemented | Standards summary, evidence volume, export readiness |
| Evidence | `/app/evidence` | `components/evidence/AdminEvidenceView.tsx` | ✅ Implemented | Ledger record viewer (flag-gated) |
| Exports | `/app/exports` | `components/exports/ExportReadiness.tsx` | ✅ Implemented | Readiness summary |
| Standards | `/app/standards` | `components/standards/StandardsRegistry.tsx` | ✅ Implemented | Reads DEFAULT_STANDARDS; admin view of standards registry |

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
| teacher | 8 | primary-nav, page-title, command-center, cohorts, reviews, builder, pickups, help-menu |
| professional_development | 3 | primary-nav, page-title, help-menu |
| admin | 7 | primary-nav, page-title, standards, evidence, exports, data-retention, help-menu |

**Flag-gated steps:**
- `core-mount` step (student_independent, student_enrolled): requires `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT=true`

**Tour gaps:**
- professional_development tour still has only 3 generic steps — no role-specific content for command-center, cohorts, reviews, builder screens

---

## 11. Feature Flags

All flags are read at module-load time from `process.env`. Default to `false` if not set. Never crash when disabled — always degrade gracefully.

### Phase 1 Flags (`lib/config/featureFlags.ts#phase1FeatureFlags`)

| Flag | Default | Purpose | Status |
|------|---------|---------|--------|
| `NEXT_PUBLIC_ENABLE_LEDGER` | false | Enables local ledger persistence in Studio/Credentials/Evidence | ✅ Wired |
| `NEXT_PUBLIC_ENABLE_MCP` | false | MCP integration | ⚠️ **GAP** — flag exists, no implementation |
| `NEXT_PUBLIC_ENABLE_PICKUP` | false | Pickups feature in facilitator nav | ✅ Wired — PickupsPanel renders when on, disabled message when off |
| `NEXT_PUBLIC_ENABLE_OFFLINE` | false | Offline mode | ⚠️ **GAP** — flag exists, no implementation |
| `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT` | false | Shows legacy core bridge at `/app/core` | ✅ Wired |

### Phase 3 Flags (`lib/config/featureFlags.ts#phase3FeatureFlags`)

| Flag | Default | Purpose | Status |
|------|---------|---------|--------|
| `NEXT_PUBLIC_ENABLE_RUNTIME` | false | Activates runtime event dispatch (mission lifecycle) | ✅ Wired |
| `NEXT_PUBLIC_ENABLE_LEDGER` | false | (shared with Phase 1) | ✅ Wired |
| `NEXT_PUBLIC_ENABLE_DB_LEDGER` | false | DB-backed ledger via SQLite adapter | ✅ Wired — `shouldUseDbLedger()` called in StudioWorkspace, CredentialsSummary, AdminEvidenceView |
| `NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER` | false | Keyword-based standards verification in Studio | ✅ Wired |

### Phase 4 Flags (env only, no featureFlags.ts constant group)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA` | false | Local Ollama LLM provider |
| `NEXT_PUBLIC_ENABLE_FEDERATION` | false | Agent federation gateway |

---

## 12. End-to-End Gap Analysis

This section documents every known gap between the product spec and the current implementation, ranked by severity.

### ✅ Resolved Critical Gaps (wrong UX / broken role experience)

#### GAP-01: Teacher home shows student PLE UI
- **File:** `app/app/page.tsx:20`
- **Issue:** **RESOLVED** ✅ `teacher` role has no branch in home page logic. Falls through to `<PLEHome />` — a student screen with mission drafts and studio entry.
- **Expected:** A `TeacherHome` dashboard component showing Command Center summary, active cohorts, review queue snapshot.
- **Fix:** Add `if (role === "teacher") return <TeacherHome />;` and create `components/dashboards/TeacherHome.tsx`.
- **Resolution:** `components/dashboards/TeacherHome.tsx` implemented; `app/app/page.tsx` dispatches teacher role to it.

#### GAP-02: Admin home shows student PLE UI
- **File:** `app/app/page.tsx:20`
- **Issue:** **RESOLVED** ✅ `admin` role has no branch in home page logic. Falls through to `<PLEHome />`.
- **Expected:** An `AdminHome` dashboard component showing standards summary, evidence volume, export readiness.
- **Fix:** Add `if (role === "admin") return <AdminHome />;` and create `components/dashboards/AdminHome.tsx`.
- **Resolution:** `components/dashboards/AdminHome.tsx` implemented; `app/app/page.tsx` dispatches admin role to it.

### ✅ Resolved High-Priority Gaps (placeholder screens with no content)

#### GAP-03: Missions screen — no implementation
- **Route:** `/app/missions`
- **Current:** **RESOLVED** ✅ Generic catch-all placeholder ("Placeholder for the Missions experience.")
- **Expected:** Mission list, launch flow, mission lifecycle actions (start, submit).
- **Missing:** `components/missions/` directory, dedicated `app/app/missions/page.tsx`.
- **Resolution:** `components/missions/MissionsList.tsx` implemented with lifecycle actions; `app/app/missions/page.tsx` dedicated route; `/api/missions` API route added.

#### GAP-04: Portfolio screen — no implementation
- **Route:** `/app/portfolio`
- **Current:** **RESOLVED** ✅ Generic catch-all placeholder.
- **Expected:** Evidence portfolio view, artifact gallery, credential progress.
- **Missing:** `components/portfolio/` directory, dedicated `app/app/portfolio/page.tsx`.
- **Resolution:** `components/portfolio/PortfolioGallery.tsx` implemented; `app/app/portfolio/page.tsx` dedicated route.

#### GAP-05: Command Center — no implementation
- **Route:** `/app/command-center`
- **Current:** **RESOLVED** ✅ Generic catch-all placeholder.
- **Expected:** Teacher/PD operational dashboard (active cohorts, pickup queue, review backlog).
- **Missing:** `components/command-center/` directory, dedicated `app/app/command-center/page.tsx`.
- **Resolution:** `components/command-center/CommandCenterDashboard.tsx` implemented (mock data); dedicated page route added.

#### GAP-06: Cohorts — no implementation
- **Route:** `/app/cohorts`
- **Current:** **RESOLVED** ✅ Generic catch-all placeholder.
- **Expected:** Cohort list with learner counts, assignment controls.
- **Missing:** `components/cohorts/` directory.
- **Resolution:** `components/cohorts/CohortsList.tsx` implemented (mock data); dedicated page route added.

#### GAP-07: Reviews — no implementation
- **Route:** `/app/reviews`
- **Current:** **RESOLVED** ✅ Generic catch-all placeholder.
- **Expected:** Artifact review queue, verdict submission (approve/return/flag).
- **Missing:** `components/reviews/` directory.
- **Resolution:** `components/reviews/ReviewQueue.tsx` implemented with approve/return/flag verdict UI (mock data); dedicated page route added.

#### GAP-08: Standards — no implementation
- **Route:** `/app/standards`
- **Current:** **RESOLVED** ✅ Generic catch-all placeholder.
- **Expected:** Standards registry admin view, plugin config.
- **Missing:** `components/standards/` directory.
- **Resolution:** `components/standards/StandardsRegistry.tsx` implemented; reads `DEFAULT_STANDARDS` from `localVerifier.ts`; dedicated page route added. Note: standards registry is still read-only in admin UI — see GAP-28.

#### GAP-09: Builder — no implementation
- **Route:** `/app/builder`
- **Current:** **RESOLVED** ✅ Generic catch-all placeholder. Feature flag `NEXT_PUBLIC_ENABLE_PICKUP` exists but is unrelated.
- **Expected:** Mission/cohort builder for facilitators.
- **Missing:** `components/builder/` directory.
- **Resolution:** `components/builder/BuilderWorkspace.tsx` implemented (mock data); dedicated page route added.

#### GAP-10: Pickups — no implementation behind flag
- **Route:** `/app/pickups`
- **Current:** **RESOLVED** ✅ Generic placeholder. `NEXT_PUBLIC_ENABLE_PICKUP` flag defined but not checked anywhere in pickups route.
- **Expected:** When flag on: pickup assignment UI. When flag off: disabled message.
- **Missing:** `components/pickups/` directory, flag gate in route.
- **Resolution:** `components/pickups/PickupsPanel.tsx` implemented with `NEXT_PUBLIC_ENABLE_PICKUP` flag gate; dedicated page route added.

### 🟡 Medium-Priority Gaps (contracts exist, no wiring)

#### GAP-11: DB Ledger implemented but never selected
- **File:** `lib/ledger/dbAdapter.ts`
- **Issue:** **RESOLVED** ✅ `createDbLedgerAdapter()` is a **fully functional SQLite implementation** — it opens a real DB file, creates the `ledger_records` table, and has prepared statements for `readAll`, `upsert` (with `ON CONFLICT`), and `findByMission`. A `shouldUseDbLedger()` helper also exists and reads the flag. However, no consumer ever calls `shouldUseDbLedger()` — `StudioWorkspace`, `CredentialsSummary`, and `AdminEvidenceView` all import `localLedgerAdapter` directly and unconditionally. Enabling `NEXT_PUBLIC_ENABLE_DB_LEDGER=true` currently has no effect.
- **Fix:** In each ledger consumer, replace the direct `localLedgerAdapter` import with a conditional: `shouldUseDbLedger() ? createDbLedgerAdapter() : localLedgerAdapter`.
- **Resolution:** `shouldUseDbLedger()` now called in `StudioWorkspace`, `CredentialsSummary`, and `AdminEvidenceView`; `/api/ledger/records` API route added.

#### GAP-12: Dead code in catch-all for `/app/core` and `/app/forbidden`
- **File:** `app/app/[[...slug]]/page.tsx:40-88`
- **Issue:** **RESOLVED** ✅ The catch-all contains explicit handling blocks for `/app/core` (static text, lines 68-88) and `/app/forbidden` (lines 40-42), but **dedicated pages take Next.js App Router priority**: `app/app/core/page.tsx` and `app/app/forbidden/page.tsx` both exist and are the actual handlers. The catch-all branches are unreachable dead code.
- **Note:** `CoreMountRuntime.tsx` and `CoreMountRuntimeLoader.tsx` ARE properly wired — `app/app/core/page.tsx` imports and uses them correctly via `createCoreMountRuntime()`.
- **Fix:** Remove the `/app/core` and `/app/forbidden` handling blocks from the catch-all to eliminate confusion.
- **Resolution:** Dead `/core` and `/forbidden` branches removed from `app/app/[[...slug]]/page.tsx`.

#### GAP-13: MCP integration missing
- **Issue:** `NEXT_PUBLIC_ENABLE_MCP=true` flag has no corresponding implementation, component, API route, or UI entry point.
- **Fix:** Define the MCP integration contract before implementation; create a dedicated ticket.
- **Status:** Still open — stub only.

#### GAP-14: Offline mode missing
- **Issue:** `NEXT_PUBLIC_ENABLE_OFFLINE=true` flag has no corresponding implementation (service worker, offline ledger sync, etc.).
- **Fix:** Define the offline contract before implementation; create a dedicated ticket.
- **Status:** Still open — stub only.

#### GAP-22: LLM routing layer never instantiated
- **Files:** `lib/llm/router.ts`, `lib/llm/providers/localOllama.ts`, `lib/llm/providers/cloudManaged.ts`
- **Issue:** **RESOLVED** ✅ `ModelRouter`, `LocalOllamaProvider`, and `CloudManagedProvider` are fully typed and implemented but **no API route or component ever instantiates or calls them**. The entire LLM routing layer is a disconnected island — enabling `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA` or configuring AWS does nothing visible in the app.
- **Sub-issue:** `LocalOllamaProvider.infer()` calls `buildFallbackResponse()` with `usedFallback: false` even when the provider is disabled. This means if `ModelRouter` were ever wired up, a disabled Ollama provider would appear to "succeed," preventing the router from triggering cloud fallback.
- **Fix:** Create an API route (e.g. `app/api/infer/route.ts`) that instantiates `ModelRouter` with the configured providers, then wire it to a UI entry point (e.g. studio AI assist). Fix `LocalOllamaProvider` to return `usedFallback: true` when disabled.
- **Resolution:** `ModelRouter` instantiated in `/api/inference` route; `LocalOllamaProvider` fixed to return `usedFallback: true` when disabled.

#### GAP-23: Orchestration queue never instantiated
- **Files:** `lib/orchestration/queueAdapter.ts`, `lib/orchestration/workerRunner.ts`, `lib/orchestration/stateMachine.ts`
- **Issue:** **RESOLVED** ✅ `InMemoryQueueAdapter` and `runWorkerLifecycle` are fully implemented (priority sorting, idempotency keying, retry logic, deterministic state machine) but **no API route or background job ever creates an instance or enqueues work**. The orchestration system runs nowhere.
- **Fix:** Create at minimum an API route that accepts job submissions and a worker invocation path. Long-term: back the adapter with SQS as contracted in `infra/aws-baseline.json`.
- **Resolution:** `InMemoryQueueAdapter` and `runWorkerLifecycle` wired in `/api/orchestration/worker-run` route.

#### GAP-24: Audit log writes to disk — broken in serverless
- **File:** `lib/observability/audit.ts`
- **Issue:** **RESOLVED** ✅ `recordAuditEvent()` uses `appendFileSync` to write NDJSON to `docs/status/audit-log.ndjson` via a **synchronous filesystem write** to a project-relative path. In Vercel's serverless runtime the project directory is read-only — these writes fail silently, and any writes that do succeed on a local/container run are ephemeral and lost on the next deploy. The audit trail (federation events, webhook events) is never actually persisted in production.
- **Fix:** Replace `appendFileSync` with an append to a durable store — at minimum a writable path like `/tmp` for local dev, and a real append destination (DynamoDB, logging service, or Vercel Log Drains) for production.
- **Resolution:** `audit.ts` now writes to `/tmp` in dev and uses `console.log` in production (serverless-safe).

#### GAP-25: Clerk webhook handler discards event payload
- **File:** `app/api/webhooks/clerk/route.ts`
- **Issue:** **RESOLVED** ✅ The HMAC signature verification is correctly implemented using `timingSafeEqual`. However, after accepting the verified webhook, the handler **does nothing with the body** — it reads it only for signature verification, then returns `{ ok: true }`. No `user.created`, `user.updated`, or `session.created` events are processed. Role changes in Clerk do not propagate to any app-side record or cache.
- **Fix:** Parse the webhook event type and payload, then handle relevant events (e.g. sync `publicMetadata.role` changes to a server-side store, invalidate role caches).
- **Resolution:** Webhook handler now parses and handles `user.created`, `user.updated`, and `session.created` event types.

#### GAP-26: Standards plugin architecture defined but bypassed
- **File:** `lib/standards/contracts/plugins.ts`
- **Issue:** **RESOLVED** ✅ `createRulePlugin()` and `runStandardsPlugins()` implement a complete plugin dispatch system for standards verification. However, `StudioWorkspace` calls `verifyArtifactText()` directly from `lib/standards/verifier/localVerifier.ts`, which internally calls `keywordStandardsRule` without going through the plugin registry. The plugin system is fully coded but never invoked anywhere.
- **Fix:** Wire `runStandardsPlugins()` into the verification call in `StudioWorkspace`, replacing the direct `verifyArtifactText()` call, so that additional plugins can be registered and composed.
- **Resolution:** `runStandardsPlugins()` now called in `StudioWorkspace` instead of `verifyArtifactText()` directly.

### 🟢 Low-Priority Gaps (polish / UX improvements)

#### GAP-15: Landing page CTA differentiation
- **File:** `app/page.tsx`
- **Issue:** "Teacher Login" and "Admin Info" both route to `/sign-in`. No role-prefill or separate onboarding paths.
- **Expected:** Teacher/admin CTAs should either pre-set a role hint or route to dedicated onboarding.
- **Status:** Partially improved by the landing page redesign; full role-prefill path not yet implemented.

#### GAP-16: Teacher & admin onboarding tours are minimal
- **File:** `lib/onboarding/tourSteps.ts`
- **Issue:** **RESOLVED** ✅ Teacher and admin tours have only 3 generic steps (nav, home, help). No steps for command-center, cohorts, reviews, standards.
- **Fix:** Add role-specific steps once those screens exist.
- **Resolution:** Teacher tour expanded to 8 steps (primary-nav, page-title, command-center, cohorts, reviews, builder, pickups, help-menu); admin tour expanded to 7 steps (primary-nav, page-title, standards, evidence, exports, data-retention, help-menu).

#### GAP-17: student_enrolled org check not enforced
- **File:** `app/app/layout.tsx:32`
- **Issue:** `student_enrolled` role is not in the org-required check (only teacher, professional_development, admin). Enrolled students belong to classrooms — they may need org validation too.
- **Fix:** Confirm product decision; if org required for enrolled students, add to check.
- **Status:** Still open — pending product decision.

#### GAP-18: React hook dependency warnings
- **Files:** `components/ple/PLEHome.tsx`, `components/studio/StudioWorkspace.tsx`
- **Issue:** **RESOLVED** ✅ 2 `react-hooks/exhaustive-deps` ESLint warnings (non-blocking but add review noise).
- **Fix:** Wrap dependent values in `useCallback`/`useMemo` as appropriate.
- **Resolution:** `useCallback`/`useMemo` applied in both `PLEHome` and `StudioWorkspace`; lint warnings cleared.

#### GAP-19: Legacy Vite core (`src/`) migration incomplete
- **Files:** `src/App.tsx`, `src/main.tsx`, `src/services/geminiService.ts`
- **Issue:** The Vite core exists in `src/` and `vite.config.ts` is present but the migration path to Next.js routes is only partially defined.
- **Fix:** Screen-by-screen migration per Phase 2 cutover doc (`docs/phase2-cutover.md`).
- **Status:** Still open — ongoing migration work.

#### GAP-20: `docs/qa/role-matrix.md` incomplete — 6 routes missing
- **File:** `docs/qa/role-matrix.md`
- **Issue:** **RESOLVED** ✅ The QA matrix only documents 12 routes, but `lib/auth/routeAccess.ts` defines 17 routes. Six are absent from the matrix:
  - `/app/portfolio`
  - `/app/pickups`
  - `/app/builder`
  - `/app/standards`
  - `/app/exports`
  - `/app/forbidden`
- **Fix:** Add the 6 missing rows to `docs/qa/role-matrix.md` and run `verify:role-routes` to confirm parity.
- **Resolution:** `docs/qa/role-matrix.md` updated with all 21+ routes including the previously missing 6.

#### GAP-21: No sign-out button in AppShell
- **File:** `components/app-shell/AppShell.tsx`
- **Issue:** **RESOLVED** ✅ The shell header shows role label and user name but has no sign-out link or button. Users authenticated via Clerk have no in-app path to log out. The Help `<details>` menu only contains "Restart tour". Signing out currently requires the user to navigate to `/sign-in` manually or clear their session.
- **Fix:** Add a Clerk `<SignOutButton>` (or equivalent redirect to `/sign-in`) inside the Help menu or as a standalone header control.
- **Resolution:** Clerk `<SignOutButton>` added to the Help menu in `AppShell`.

#### GAP-27: Data retention and deletion hooks never triggered
- **Files:** `lib/ledger/adapter.ts`, `lib/runtime/engine/store.ts`
- **Issue:** **RESOLVED** ✅ Four data lifecycle functions exist but nothing calls them:
  - `purgeLedgerRecordsBefore(cutoffIso)` — time-based ledger retention
  - `deleteLedgerRecordsByLearner(learnerId)` — GDPR-style learner deletion from ledger
  - `purgeRuntimeStateBefore(cutoffIso)` — runtime state retention
  - `deleteRuntimeStateByLearner(learnerId)` — GDPR-style runtime state deletion
  No UI, API endpoint, admin screen, or scheduled job invokes any of these. The data retention/right-to-erasure mechanism is implemented but completely unconnected.
- **Fix:** Wire to an admin API endpoint and/or an admin UI control in the Standards or Evidence screens.
- **Resolution:** `/api/admin/data-retention/*` routes added, wiring all 4 retention/deletion functions.

#### GAP-28: Standards registry is hardcoded — no admin path to configure
- **File:** `lib/standards/verifier/localVerifier.ts`
- **Issue:** `DEFAULT_STANDARDS` contains exactly 2 hardcoded standards (`rw.mission.clarity`, `rw.artifact.reflection`) with keyword sets. The `/app/standards` admin screen is a placeholder. There is no way for an admin to add, modify, disable, or weight standards through the UI. The plugin architecture (`plugins.ts`) exists but is also bypassed (see GAP-26).
- **Fix:** Implement the Standards admin screen to read/write a standards registry; connect it to the verifier and plugin system.
- **Status:** Partially improved — `StandardsRegistry` admin UI now displays `DEFAULT_STANDARDS`; the registry is still read-only (hardcoded in `localVerifier.ts`). Full write/configure path not yet implemented.

#### GAP-29: Federation dispatch is a stub — tasks accepted but never routed
- **File:** `app/api/federation/route.ts`
- **Issue:** **RESOLVED** ✅ The federation POST endpoint validates the flag, validates the task envelope, and returns `{ accepted: true }` — but it never actually dispatches the task to any agent. No agent registry lookup occurs, no capability matching runs, `buildCapabilityIndex` from `registryContracts.ts` is never called, and there is no GET endpoint for agent discovery. The federation control plane accepts work but does nothing with it.
- **Fix:** Implement agent registry persistence, capability routing via `buildCapabilityIndex`, and actual task dispatch. Add a GET endpoint for agent discovery.
- **Resolution:** `/api/federation` POST now dispatches via `buildCapabilityIndex` for capability routing; GET endpoint added for agent discovery.

### 🟡 Sprint 7 Gaps — Discovered 2026-02-26 Post-Integration Audit

#### GAP-30: Facilitator screens — hardcoded mock data never replaced
- **Files:** `components/command-center/CommandCenterDashboard.tsx`, `components/reviews/ReviewQueue.tsx`, `components/builder/BuilderWorkspace.tsx`
- **Issue:** All three facilitator screens were implemented in Sprint 5 with mock/static data. No API routes back them. The mock data was appropriate as scaffolding, but must be replaced with live data before the product is useful.
- **Fix:** Create `/api/command-center` aggregation route; create `/api/reviews` route from ledger; wire `BuilderWorkspace` mission creation to `/api/missions`.
- **Status:** Open — Sprint 7 tickets #401, #402, #403.

#### GAP-31: Standards verification pipeline uses DEFAULT_STANDARDS only — ignores admin-configured standards
- **File:** `lib/standards/contracts/plugins.ts`, `components/studio/StudioWorkspace.tsx`
- **Issue:** `runStandardsPlugins()` was wired in Sprint 6 (GAP-26 fix), but it still runs the keyword rule against `DEFAULT_STANDARDS` hardcoded in `localVerifier.ts`. The admin CRUD API and SQLite registry added in Sprint 6 (#302) are never consulted. Admins can add standards to the DB but they have no effect on verification.
- **Fix:** Fetch standards from `/api/admin/standards` in StudioWorkspace on mount; pass to `runStandardsPlugins()`. Update plugin interface to accept `standards` parameter.
- **Status:** Open — Sprint 7 ticket #404.

#### GAP-32: Professional development onboarding tour has only 3 generic steps
- **File:** `lib/onboarding/tourSteps.ts`
- **Issue:** Despite the `professional_development` role having 8 nav items and role-specific screens (Command Center, Cohorts, Reviews, Builder), the tour only covers `primary-nav`, `page-title`, `help-menu`. Teacher tour was expanded to 8 steps in Sprint 5; PD tour was not.
- **Fix:** Add 5 PD-specific tour steps: `command-center`, `cohorts`, `reviews`, `builder`, `pickups`.
- **Status:** Open — Sprint 7 ticket #400.

#### GAP-33: Landing page teacher/admin CTAs lack role prefill
- **File:** `app/page.tsx`
- **Issue:** Learner CTAs already carry `?role=student_independent` / `?role=adult_learner` query params. Teacher and Admin CTAs route to `/sign-in` with no role context, so the sign-in page cannot pre-select or validate the intended role.
- **Fix:** Add `?role=teacher` and `?role=admin` to respective CTA hrefs; the sign-up/sign-in pages already parse this param.
- **Status:** Open — Sprint 7 ticket #405.

#### GAP-34: Federation dispatch in-memory only — tasks lost on process restart
- **File:** `lib/federation/dispatch.ts`
- **Issue:** `DISPATCHED_TASKS` is a module-level array. It works within a single Node.js process lifetime but is cleared on any restart, redeploy, or cold start. In Vercel's serverless runtime, each function invocation may be a new process. There is no durable task log.
- **Fix:** Persist dispatched tasks to SQLite via a new `lib/federation/persistence.ts` adapter; swap `DISPATCHED_TASKS` array for DB reads/writes.
- **Status:** Open — Sprint 7 ticket #406.

#### GAP-35: GAP-28 partial resolution — StandardsRegistry UI still falls back to DEFAULT_STANDARDS when DB is empty
- **File:** `components/standards/StandardsRegistry.tsx`
- **Issue:** Sprint 6 added write capability to `StandardsRegistry`. However, if `/api/admin/standards` returns an empty array (DB not seeded), the component falls back to displaying `DEFAULT_STANDARDS` from `localVerifier.ts`, silently mixing the DB path with the hardcoded path. The fallback masks the fact that the DB is empty and may confuse admins.
- **Fix:** On first load with empty DB response, auto-seed the DB with `DEFAULT_STANDARDS` via a POST to `/api/admin/standards`. Eliminates the silent fallback.
- **Status:** Open — addressed in Sprint 7 ticket #404 (same agent).

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
| `components/dashboards/TeacherHome.tsx` | Teacher home (resolved GAP-01) |
| `components/dashboards/AdminHome.tsx` | Admin home (resolved GAP-02) |

### Core App Routes

| File | Purpose |
|------|---------|
| `app/page.tsx` | Public landing page |
| `app/app/layout.tsx` | Protected shell layout (auth check, role extraction, nav, onboarding) |
| `app/app/page.tsx` | Home route — dispatches to role-specific dashboard |
| `app/app/[[...slug]]/page.tsx` | Catch-all for unimplemented routes (placeholder + profile inline) — dead branches for `/app/core` and `/app/forbidden` removed (GAP-12 resolved) |
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
| `lib/ledger/dbAdapter.ts` | SQLite adapter — now wired via `shouldUseDbLedger()` in consumers (GAP-11 resolved) |
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

*Last updated: 2026-02-26 — Sprint 6 complete: 8/8 integration tickets closed. Gap resolution: 23 of 29 gaps resolved (GAP-26 fixed in Sprint 6).*
*Resolved in this pass: GAP-01, GAP-02, GAP-03, GAP-04, GAP-05, GAP-06, GAP-07, GAP-08, GAP-09, GAP-10, GAP-11, GAP-12, GAP-16, GAP-18, GAP-20, GAP-21, GAP-22, GAP-23, GAP-24, GAP-25, GAP-26, GAP-27, GAP-29.*
*Still open: GAP-13 (MCP stub), GAP-14 (offline stub), GAP-15 (landing CTA differentiation, partial), GAP-17 (enrolled org check, pending product decision), GAP-19 (Vite migration, ongoing), GAP-28 (standards registry hardcoded, partial).*
*Branch: `claude/gap-analysis-user-roles-RHg64`*

---

## 17. Sprint 6 — Integration Wiring & Persistence Layer

> **Status:** 🟡 In progress — 2026-02-26
> **Branch:** `claude/gap-analysis-user-roles-RHg64`
> **Agent swarm:** 8 tickets, all parallelisable (verified zero file overlap)

### Ticket Manifest

| Ticket | Title | Lane | Owner Files | Status |
|--------|-------|------|-------------|--------|
| #300 | Wire CohortsList to real `/api/cohorts` | C | `components/cohorts/CohortsList.tsx` | ✅ Done |
| #301 | DB ledger schema: add 7 missing columns | C | `lib/ledger/dbAdapter.ts` | ✅ Done |
| #302 | Standards admin CRUD API + SQLite persistence | C | `lib/standards/adapter.ts` (new), `app/api/admin/standards/route.ts` (new), `components/standards/StandardsRegistry.tsx` | ✅ Done |
| #303 | Fix GAP-26: wire `runStandardsPlugins` in Studio | C | `components/studio/StudioWorkspace.tsx`, `lib/standards/contracts/plugins.ts` | ✅ Done |
| #304 | Wire AES-GCM encryption into ledger + runtime adapters | C | `lib/ledger/adapter.ts`, `lib/runtime/engine/store.ts` | ✅ Done |
| #305 | Session timer: emit TRACE phase events to runtime store | C | `lib/session/timer.ts`, `lib/session/events.ts` (new) | ✅ Done |
| #306 | Orchestration executor: implement job dispatch | D | `app/api/orchestration/worker-run/route.ts`, `lib/orchestration/executors.ts` (new) | ✅ Done |
| #307 | Federation: complete agent task dispatch + persistence | D | `app/api/federation/route.ts`, `lib/federation/dispatch.ts` (new) | ✅ Done |

### Swarm Overlap Verification

All 8 agents operate on strictly disjoint file sets:

```
Agent #300 → components/cohorts/CohortsList.tsx
Agent #301 → lib/ledger/dbAdapter.ts
Agent #302 → lib/standards/adapter.ts, app/api/admin/standards/route.ts, components/standards/StandardsRegistry.tsx
Agent #303 → components/studio/StudioWorkspace.tsx, lib/standards/contracts/plugins.ts
Agent #304 → lib/ledger/adapter.ts, lib/runtime/engine/store.ts
Agent #305 → lib/session/timer.ts, lib/session/events.ts
Agent #306 → app/api/orchestration/worker-run/route.ts, lib/orchestration/executors.ts
Agent #307 → app/api/federation/route.ts, lib/federation/dispatch.ts
```

Zero shared files. `app/app/layout.tsx` untouched by all agents.

### Agent Boundary Rules (Sprint 6)

1. Each agent operates exclusively on its **Owner Files** — no modifications to any files outside the listed set.
2. Agents must **not** modify `lib/auth/`, `middleware.ts`, `app/app/layout.tsx`, `app/layout.tsx`, `scripts/`, or `docs/qa/`.
3. New files must be placed inside the owning lane's directory.
4. All new env vars require a corresponding entry in `.env.example`.
5. Every agent must pass `npm run lint` and `npm run typecheck` before committing.

### Sprint 6 Acceptance Criteria

- [x] `npm run verify:release-gate` passes after all merges ✅
- [x] CohortsList renders real org members when teacher/PD role present ✅
- [x] DB ledger stores `dataTier`, `rigorLevel`, `competencies` when `NEXT_PUBLIC_ENABLE_DB_LEDGER=true` ✅
- [x] Admin can add/edit/delete standards at `/app/standards` ✅
- [x] Studio calls `runStandardsPlugins()` — verified by unit check of plugin dispatch path ✅
- [x] localStorage encrypted when `NEXT_PUBLIC_LOCAL_STORAGE_ENCRYPTION_KEY` is set ✅
- [x] TRACE phase events written to runtime store on each phase transition ✅
- [x] Orchestration jobs enqueue and execute with typed job handlers (not no-op) ✅
- [x] Federation POST dispatches to assigned agent endpoint; GET returns live registry ✅

---

## 18. Sprint 7 — Live Data Wiring & Gap Resolution

> **Status:** 🟡 In progress — 2026-02-26
> **Branch:** `claude/gap-analysis-user-roles-RHg64`
> **Agent swarm:** 7 tickets, all parallelisable (verified zero file overlap)
> **Audit basis:** Post-Sprint-6 gap analysis confirming GAP-30 through GAP-35

### Ticket Manifest

| Ticket | Title | Gap | Lane | Owner Files | Status |
|--------|-------|-----|------|-------------|--------|
| #400 | Expand PD onboarding tour (GAP-32) | GAP-32 | B | `lib/onboarding/tourSteps.ts` | 🟡 Queued |
| #401 | CommandCenter real data API (GAP-30a) | GAP-30 | C | `components/command-center/CommandCenterDashboard.tsx`, `app/api/command-center/route.ts` (new) | 🟡 Queued |
| #402 | ReviewQueue real data API (GAP-30b) | GAP-30 | C | `components/reviews/ReviewQueue.tsx`, `app/api/reviews/route.ts` (new) | 🟡 Queued |
| #403 | BuilderWorkspace wire to missions (GAP-30c) | GAP-30 | C | `components/builder/BuilderWorkspace.tsx` | 🟡 Queued |
| #404 | Wire verification to DB standards + seed fallback (GAP-31, GAP-35) | GAP-31+35 | C | `lib/standards/contracts/plugins.ts`, `components/studio/StudioWorkspace.tsx`, `components/standards/StandardsRegistry.tsx` | 🟡 Queued |
| #405 | Landing page role-prefill CTAs (GAP-33) | GAP-33 | B | `app/page.tsx` | 🟡 Queued |
| #406 | Federation dispatch SQLite persistence (GAP-34) | GAP-34 | D | `lib/federation/dispatch.ts`, `lib/federation/persistence.ts` (new) | 🟡 Queued |

### Swarm Overlap Verification

```
Agent #400 → lib/onboarding/tourSteps.ts
Agent #401 → components/command-center/CommandCenterDashboard.tsx, app/api/command-center/route.ts
Agent #402 → components/reviews/ReviewQueue.tsx, app/api/reviews/route.ts
Agent #403 → components/builder/BuilderWorkspace.tsx
Agent #404 → lib/standards/contracts/plugins.ts, components/studio/StudioWorkspace.tsx, components/standards/StandardsRegistry.tsx
Agent #405 → app/page.tsx
Agent #406 → lib/federation/dispatch.ts, lib/federation/persistence.ts
```

Zero shared files. `app/app/layout.tsx` untouched by all agents.

### Deferred Gaps (contract undefined / product decision pending)

| Gap | Reason Deferred |
|-----|-----------------|
| GAP-13 (MCP) | No MCP contract defined; stub is correct holding pattern |
| GAP-14 (Offline) | Service worker + cache API requires dedicated contract ticket |
| GAP-17 (student_enrolled org) | Awaiting product decision |
| GAP-19 (Vite migration) | Ongoing screen-by-screen work, out of sprint scope |

### Sprint 7 Acceptance Criteria

- [ ] `npm run verify:release-gate` passes after all merges
- [ ] PD tour has ≥ 6 steps including command-center, cohorts, reviews, builder
- [ ] CommandCenter shows real cohort counts from `/api/cohorts`
- [ ] ReviewQueue shows real ledger artifacts pending review
- [ ] BuilderWorkspace mission creation POSTs to `/api/missions`
- [ ] Studio verification fetches DB standards; falls back gracefully if empty
- [ ] StandardsRegistry auto-seeds DEFAULT_STANDARDS into DB on first empty load
- [ ] Landing teacher CTA links to `/sign-in?role=teacher`; admin to `/sign-in?role=admin`
- [ ] Federation task log survives process restart (SQLite-backed)
