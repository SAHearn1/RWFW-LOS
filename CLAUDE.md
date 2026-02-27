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

**Current state (as of 2026-02-27):** Phases 1–6 execution complete. Phase 4 Runtime Realization complete (all engine routes wired). Release gate (verify:release-gate) fully passes including HTTP smoke. Remaining work is data governance (GAP-27, GAP-28) and low-priority polish items.

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
| Missions | `/app/missions` | `app/app/missions/page.tsx` | ✅ Implemented | Mission list, lifecycle, placeholder content |
| Portfolio | `/app/portfolio` | `app/app/portfolio/page.tsx` | ✅ Implemented | Portfolio view, artifact gallery placeholder |

### Facilitator Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| PD Home | `/app` (pd role) | `components/dashboards/ProfessionalDevelopmentHome.tsx` | ✅ Implemented | Session pipeline, reviews, cohort health |
| Teacher Home | `/app` (teacher role) | `components/dashboards/TeacherHome.tsx` | ✅ Implemented | Intervention queue, cohort flow, evidence reviews |
| Command Center | `/app/command-center` | `app/app/command-center/page.tsx` | ✅ Implemented | Facilitator operations hub |
| Cohorts | `/app/cohorts` | `app/app/cohorts/page.tsx` | ✅ Implemented | Cohort management |
| Pickups | `/app/pickups` | `app/app/pickups/page.tsx` | ✅ Implemented | Pickup assignment queue (flag-gated) |
| Reviews | `/app/reviews` | `app/app/reviews/page.tsx` | ✅ Implemented | Artifact review queue |
| Builder | `/app/builder` | `app/app/builder/page.tsx` | ✅ Implemented | Mission/cohort builder |

### Admin Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| Admin Home | `/app` (admin role) | `components/dashboards/AdminHome.tsx` | ✅ Implemented | Standards health, evidence readiness, exports |
| Evidence | `/app/evidence` | `components/evidence/AdminEvidenceView.tsx` | ✅ Implemented | Ledger record viewer (flag-gated) |
| Exports | `/app/exports` | `components/exports/ExportReadiness.tsx` | ✅ Implemented | Readiness summary |
| Standards | `/app/standards` | `app/app/standards/page.tsx` | ✅ Implemented | Standards registry admin view |

### Super Admin Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| Super Admin Home | `/app` (super_admin) | `components/dashboards/SuperAdminHome.tsx` | ✅ Implemented | Stats grid, authority boundaries |
| Users | `/app/super-admin/users` | dedicated page | ✅ Implemented | User roster |
| Teachers | `/app/super-admin/teachers` | dedicated page | ✅ Implemented | Teacher assignment |
| Licenses | `/app/super-admin/licenses` | dedicated page | ✅ Implemented | License manager |
| Institutions | `/app/super-admin/institutions` | dedicated page | ✅ Implemented | Institution accounts |

### System / Shared Screens

| Screen | Route | Component | Status | Notes |
|--------|-------|-----------|--------|-------|
| Landing | `/` | `app/page.tsx` | ✅ Implemented | Three role CTAs (learner, teacher, admin) |
| Profile | `/app/profile` | inline in catch-all | ✅ Implemented | Shows role + orgId |
| Core Mount | `/app/core` | `app/app/core/page.tsx` → `CoreMountRuntimeLoader` | ✅ Implemented | Flag-gated via `createCoreMountRuntime()` + dedicated page |
| Forbidden | `/app/forbidden` | `components/app-shell/ForbiddenPanel.tsx` | ✅ Implemented | In-app 403 view |
| Sign In | `/sign-in` | Clerk UI (graceful fallback) | ✅ Implemented | Shows "Auth Unavailable" when keys missing |
| Sign Up | `/sign-up` | Clerk UI (graceful fallback) | ✅ Implemented | Shows "Auth Unavailable" when keys missing |

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
| `NEXT_PUBLIC_ENABLE_MCP` | false | MCP integration | ⚠️ **GAP-13** — flag exists, no implementation |
| `NEXT_PUBLIC_ENABLE_PICKUP` | false | Pickups feature in facilitator nav | ✅ Wired — Pickups screen implemented |
| `NEXT_PUBLIC_ENABLE_OFFLINE` | false | Offline mode | ⚠️ **GAP-14** — flag exists, no implementation |
| `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT` | false | Shows legacy core bridge at `/app/core` | ✅ Wired |

### Phase 3 Flags (`lib/config/featureFlags.ts#phase3FeatureFlags`)

| Flag | Default | Purpose | Status |
|------|---------|---------|--------|
| `NEXT_PUBLIC_ENABLE_RUNTIME` | false | Activates runtime event dispatch (mission lifecycle) | ✅ Wired |
| `NEXT_PUBLIC_ENABLE_LEDGER` | false | (shared with Phase 1) | ✅ Wired |
| `NEXT_PUBLIC_ENABLE_DB_LEDGER` | false | DB-backed ledger via SQLite adapter | ✅ Wired — `lib/ledger/flags.ts` + `/api/ledger/records` route |
| `NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER` | false | Keyword-based standards verification in Studio | ✅ Wired |

### Phase 4 Flags (env only, no featureFlags.ts constant group)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA` | false | Local Ollama LLM provider |
| `NEXT_PUBLIC_ENABLE_FEDERATION` | false | Agent federation gateway |

---

## 12. End-to-End Gap Analysis

> **Last updated:** 2026-02-27. All critical and high-priority gaps resolved. Remaining gaps are low-medium priority.

This section documents every known gap between the product spec and the current implementation.

### ✅ Resolved Gaps (2026-02-25 → 2026-02-27)

All of the following have been implemented and closed:

| Gap | Description | Resolved |
|-----|-------------|---------|
| GAP-01 | Teacher home showed student PLE UI | ✅ `TeacherHome` component + routing added |
| GAP-02 | Admin home showed student PLE UI | ✅ `AdminHome` component + routing added |
| GAP-03 | Missions screen placeholder | ✅ `app/app/missions/page.tsx` wired |
| GAP-04 | Portfolio screen placeholder | ✅ `app/app/portfolio/page.tsx` wired |
| GAP-05 | Command Center placeholder | ✅ `app/app/command-center/page.tsx` wired |
| GAP-06 | Cohorts placeholder | ✅ `app/app/cohorts/page.tsx` wired |
| GAP-07 | Reviews placeholder | ✅ `app/app/reviews/page.tsx` wired |
| GAP-08 | Standards placeholder | ✅ `app/app/standards/page.tsx` wired |
| GAP-09 | Builder placeholder | ✅ `app/app/builder/page.tsx` wired |
| GAP-10 | Pickups placeholder | ✅ `app/app/pickups/page.tsx` wired with flag gate |
| GAP-11 | DB ledger not wired | ✅ `lib/ledger/flags.ts` + `/api/ledger/records` route |
| GAP-12 | Dead code in catch-all | ✅ Removed unreachable `/app/core` + `/app/forbidden` branches |
| GAP-20 | role-matrix.md incomplete | ✅ All 21 routes documented including super_admin |
| GAP-21 | No sign-out button | ✅ `<SignOutButton>` added to AppShell |
| GAP-22 | LLM router disconnected | ✅ `app/api/inference/route.ts` wires ModelRouter |
| GAP-23 | Orchestration queue disconnected | ✅ `app/api/orchestration/worker-run` wires SQS + DynamoDB |
| GAP-24 | Audit log broken in serverless | ✅ Serverless-safe (stdout/HTTP primary, file writes optional) |
| GAP-25 | Webhook handler discards payload | ✅ Processes user.created/user.updated, syncs metadata |
| GAP-26 | Standards plugin bypassed | ✅ `lib/standards/plugins/defaultPlugins.ts` via StudioWorkspace |
| GAP-29 | Federation dispatch stub | ✅ Agent registry, capability routing, discovery GET endpoint |
| GAP-13 | MCP integration missing | ✅ `/api/mcp/health` returns graceful 503 when flag disabled |
| GAP-14 | Offline mode missing | ✅ `/api/offline/status` returns graceful 503 when flag disabled |
| GAP-16 | Teacher/admin tours minimal | ✅ Teacher 5 steps + admin 5 steps with role-specific content |
| GAP-18 | React hook dependency warnings | ✅ `npm run lint` passes with zero warnings |
| GAP-27 | Data retention hooks unreachable | ✅ `app/api/admin/retention/route.ts` wires DB purge + audit |
| GAP-28 | Standards registry hardcoded | ✅ `StandardsRegistry` component renders real `DEFAULT_STANDARDS` |
| Sign-in 500 | Sign-in crashed without Clerk keys | ✅ Graceful "Auth Unavailable" panel |

### 🟢 Low-Priority Gaps (remaining — no code regression)

#### GAP-15: Landing page CTA differentiation
- **File:** `app/page.tsx`
- **Issue:** "Teacher Login" and "Admin Info" both route to `/sign-in`. No role-prefill or separate onboarding paths.
- **Expected:** Teacher/admin CTAs should either pre-set a role hint or route to dedicated onboarding.
- **Note:** Low priority; requires product decision on role-prefill strategy.

#### GAP-17: student_enrolled org check not enforced
- **File:** `app/app/layout.tsx:32`
- **Issue:** `student_enrolled` role is not in the org-required check (only teacher, professional_development, admin). Enrolled students belong to classrooms — they may need org validation too.
- **Fix:** Confirm product decision; if org required for enrolled students, add to check.

#### GAP-17: student_enrolled org check not enforced
- **File:** `app/app/layout.tsx:32`
- **Issue:** `student_enrolled` role is not in the org-required check. Enrolled students belong to classrooms — they may need org validation too.
- **Fix:** Confirm product decision; if org required for enrolled students, add to check.

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
| `components/dashboards/TeacherHome.tsx` | Teacher facilitator home |
| `components/dashboards/AdminHome.tsx` | Admin home |
| `components/dashboards/SuperAdminHome.tsx` | Super admin home |

### Core App Routes

| File | Purpose |
|------|---------|
| `app/page.tsx` | Public landing page |
| `app/app/layout.tsx` | Protected shell layout (auth check, role extraction, nav, onboarding) |
| `app/app/page.tsx` | Home route — dispatches to role-specific dashboard |
| `app/app/[[...slug]]/page.tsx` | Catch-all for unimplemented routes (placeholder + profile inline) |
| `app/app/core/page.tsx` | Core mount route — `createCoreMountRuntime()` + `CoreMountRuntimeLoader` |
| `app/app/forbidden/page.tsx` | In-app 403 route — renders `ForbiddenPanel` |
| `app/app/studio/page.tsx` | Studio route (role guard + StudioWorkspace) |
| `app/app/credentials/page.tsx` | Credentials route |
| `app/app/evidence/page.tsx` | Evidence route |
| `app/app/exports/page.tsx` | Exports route |
| `app/app/settings/page.tsx` | Settings route |
| `app/sign-in/[[...sign-in]]/page.tsx` | Sign-in (graceful fallback when Clerk keys absent) |

### Runtime & Ledger

| File | Purpose |
|------|---------|
| `lib/runtime/contracts/types.ts` | RuntimeMission, RuntimeArtifact, VerificationEvent types |
| `lib/runtime/engine/store.ts` | `readRuntimeState()`, `writeRuntimeState()`, `dispatchRuntimeEvent()` |
| `lib/runtime/engine/reducer.ts` | Event reducer for mission/artifact/verification lifecycle |
| `lib/ledger/adapter.ts` | Local in-memory ledger with localStorage persistence |
| `lib/ledger/dbAdapter.ts` | SQLite adapter — fully wired via `NEXT_PUBLIC_ENABLE_DB_LEDGER` flag |
| `lib/ledger/flags.ts` | `shouldUseDbLedger()` — client-safe flag helper |
| `app/api/ledger/records/route.ts` | Ledger GET/POST API (role-gated, db-backed) |
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
| `app/api/inference/route.ts` | LLM inference (ModelRouter + LocalOllama + CloudManaged) |
| `app/api/ledger/records/route.ts` | Ledger GET/POST (role-gated, DB-backed) |
| `app/api/admin/retention/route.ts` | Admin data retention POST (purge_before / delete_learner, admin+super_admin only) |
| `app/api/orchestration/worker-run/route.ts` | Orchestration worker (SQS + DynamoDB, in-memory fallback) |
| `app/api/federation/route.ts` | Federation task dispatch + discovery (GET + POST, feature-gated) |
| `app/api/webhooks/clerk/route.ts` | Clerk user sync webhook with HMAC validation + metadata sync |
| `app/api/mcp/health/route.ts` | MCP health check (503 when flag disabled) |
| `app/api/offline/status/route.ts` | Offline status (503 when flag disabled) |

### Standards & Federation

| File | Purpose |
|------|---------|
| `lib/standards/contracts/types.ts` | StandardDescriptor, VerificationRuleResult |
| `lib/standards/contracts/plugins.ts` | Plugin interface, `createRulePlugin()`, `runStandardsPlugins()` |
| `lib/standards/verifier/localVerifier.ts` | Keyword-based verification + `DEFAULT_STANDARDS` |
| `lib/standards/plugins/defaultPlugins.ts` | `runDefaultStandardsPlugins()` — wires keyword plugin |
| `lib/federation/types.ts` | Federation envelope types |
| `lib/federation/protocol.ts` | v1 protocol creators |
| `lib/federation/dispatch.ts` | `dispatchFederationTask()` — actual agent dispatch |
| `lib/federation/registry.ts` | `getFederationDiscovery()`, `resolveFederationAssignment()` |
| `lib/llm/router.ts` | `ModelRouter` — local/cloud routing with fallback |
| `lib/llm/providers/localOllama.ts` | `LocalOllamaProvider` — real HTTP to Ollama API |
| `lib/llm/providers/cloudManaged.ts` | `CloudManagedProvider` — AWS EventBridge dispatch |
| `lib/orchestration/sqsQueueAdapter.ts` | SQS-backed job queue |
| `lib/orchestration/dynamoStateStore.ts` | DynamoDB-backed orchestration state store |
| `lib/observability/audit.ts` | `recordAuditEvent()` — serverless-safe (stdout/HTTP) |
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

*Last updated: 2026-02-27 — Fourth verification pass. All critical, high, and medium-priority gaps closed. Release gate fully passes.*
*Phase 4 Runtime Realization complete. Phase 5 Data Governance: GAP-27 wired via `/api/admin/retention`.*
*All remaining gaps either have graceful stubs (GAP-13 MCP health, GAP-14 offline status) or are low-priority UX decisions (GAP-15 CTA routing, GAP-17 org check).*
*Remaining open gaps: GAP-15 (CTA differentiation — low priority UX), GAP-17 (org check — pending product decision).*
*Branch: `claude/gap-analysis-build-docs-96UGo`*
