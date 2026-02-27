# RootWork LOS — Gap Analysis: Seventh Pass
**Date:** 2026-02-27
**Branch:** `claude/gap-analysis-build-docs-96UGo`
**Inspector:** Claude Code multi-agent swarm (4 parallel agents)
**Scope:** Full codebase re-inspection post sixth-pass closure

---

## Inspection Coverage

| Lane | Files Inspected | Agent |
|------|----------------|-------|
| Auth / Routes / Middleware | middleware.ts, lib/auth/*, app/app/layout.tsx, app/app/page.tsx | Agent A |
| API Routes | All 15 app/api/*/route.ts files | Agent B |
| Components / Lib / Config | All dashboard components, app-shell, onboarding lib, nav lib, featureFlags, envGuards | Agent C |
| Runtime / Ledger / Standards / Scripts | lib/runtime/*, lib/ledger/*, lib/standards/*, lib/observability/*, lib/llm/router.ts, scripts/verify-*.mjs | Agent D |

---

## Critical (P0) — Must Fix Immediately

| ID | File | Line | Issue |
|----|------|------|-------|
| **GAP-30** | `app/api/federation/route.ts` | 30, 47 | **No auth guard on GET or POST.** Any unauthenticated request can probe federation discovery or dispatch federation tasks. Feature flag check ≠ auth. |
| **GAP-31** | `lib/ledger/flags.ts` + `lib/ledger/dbAdapter.ts` | flags:5, db:167 | **Duplicate `shouldUseDbLedger()` with different logic.** `flags.ts` checks env var directly; `dbAdapter.ts` checks `getDbLedgerAvailability()` (env + path + runtime). Callers importing wrong version get silently different behavior. |
| **GAP-32** | `lib/ledger/adapter.ts` + `lib/runtime/engine/store.ts` | adapter:57, store:44 | **Ledger/runtime purge uses `>=` instead of `<`.** "purge_before cutoffIso" should delete records strictly BEFORE cutoff (strict `<`). Both in-memory adapters incorrectly KEEP records AT the cutoff date. `dbAdapter.ts` correctly uses `<`; in-memory adapters contradict it. |
| **GAP-33** | `app/app/layout.tsx` | 40 | **Org-requirement check hardcodes a role list inline.** If a new role is added to `roles.ts`, developers must manually update this list or users bypass the org enforcement check. Violates CLAUDE.md guardrail 9 (no ad hoc role logic). |
| **GAP-34** | `app/app/page.tsx` | 22–40 | **No exhaustiveness check for role dispatch.** New roles silently fall through to `<PLEHome />` default. TypeScript won't warn. Violates CLAUDE.md guardrail 10 (no hidden magic). |

---

## High (P1) — Fix Before Next Deploy

| ID | File | Line | Issue |
|----|------|------|-------|
| **GAP-35** | `app/api/timeline/learner/route.ts` | 27 | No try-catch around `createDbLedgerAdapter()` call. DB init failure throws unhandled 500. |
| **GAP-36** | `app/api/super-admin/users/route.ts` | 60 | No try-catch around `fetch()` to Clerk API. Network failure = unhandled exception. |
| **GAP-37** | `app/api/super-admin/assign-role/route.ts` | 91 | No try-catch around `fetch()` to Clerk PATCH. Network failure = unhandled exception. |
| **GAP-38** | `app/api/webhooks/clerk/route.ts` | 65 | No try-catch around Clerk API `fetch()`. Network failure = unhandled exception. |
| **GAP-39** | `app/api/ledger/records/route.ts` | 118 | `availability.databasePath` may be `undefined` — passed to `createDbLedgerAdapter()` without null guard. |
| **GAP-40** | `app/api/ledger/records/route.ts` | 23–37 | `isLedgerRecord()` type guard validates shape but not that `payload` matches the `type` field. Mismatched records pass silently. |
| **GAP-41** | `lib/ledger/dbAdapter.ts` | 53 | `toRecord()` parses `payload_json` as `any` — no validation that parsed object matches the `type` field. DB can return mismatched records. |
| **GAP-42** | `lib/ledger/adapter.ts` | 74–78 | `upsert()` is not atomic: read→filter→push→write sequence is not transactional. Concurrent writes can lose data. |
| **GAP-43** | `lib/observability/audit.ts` | 65, 76 | Fire-and-forget audit writes (`void sendAuditEventToHttp()`, `void appendAuditEventToFile()`). Audit events silently lost on failure. No retry or error propagation. |
| **GAP-44** | `app/api/telemetry/pilot/route.ts` | 67–73 | Bearer token compared with `===` (not constant-time). Timing attack vector on token comparison. Should use `timingSafeEqual()`. |
| **GAP-45** | `middleware.ts` | 34 | Unnecessary `as unknown` type cast on `clerkProtectedMiddleware`. Hides type compatibility; code smell that misleads maintainers. |
| **GAP-46** | `lib/auth/routeAccess.ts` | 10–18 | `ALL_ROLES` array hardcoded instead of derived from `APP_ROLES`. Drift risk when roles are added. |
| **GAP-47** | `scripts/verify-http-smoke.mjs` | 44, 3 | No process cleanup timeout if server fails to start (zombie process risk). `/app/studio` missing from smoke test route list. |

---

## Medium (P2) — Fix in Next Sprint

| ID | File | Line | Issue |
|----|------|------|-------|
| **GAP-48** | `app/api/federation/route.ts` | — | Missing `runtime = "nodejs"` declaration. |
| **GAP-49** | `app/api/telemetry/pilot/route.ts` | 25 | Missing `runtime = "nodejs"` + no try-catch on `request.json()`. |
| **GAP-50** | `app/api/support/diagnostics/route.ts` | 11 | Missing `runtime = "nodejs"` + overly permissive auth (any authenticated user; should be admin-only). |
| **GAP-51** | `app/api/health/route.ts` | — | Missing `runtime = "nodejs"` (consistency with all other routes). |
| **GAP-52** | `app/api/mcp/health/route.ts`, `app/api/offline/status/route.ts` | — | Missing `runtime = "nodejs"` (consistency). |
| **GAP-53** | `lib/runtime/engine/store.ts` | 25 | `JSON.parse()` catch block silently discards all user data. Should log warning. |
| **GAP-54** | `lib/observability/audit.ts` | 17 | Audit log path is relative (`resolve("docs", "status", "audit-log.ndjson")`). Fails on serverless; should use env var or explicit absolute path. |
| **GAP-55** | `lib/observability/trace.ts` | 3 | Trace header name is `"x-rootwork-trace-id"` (lowercase) but CLAUDE.md section 5 documents `"X-Trace-Id"`. Inconsistency in logs/tooling. |
| **GAP-56** | `scripts/verify-role-routes.mjs` | 37, 52 | String-based file matching is brittle (comments can cause false positives; substring match for role names can match partial role names). |
| **GAP-57** | `scripts/verify-onboarding.mjs` | 15 | Selector regex only matches single-quoted selectors; double-quoted selectors in tourSteps.ts would be silently skipped. |
| **GAP-58** | `lib/auth/routeAccess.ts` | 20–33 | Role grouping constants (`LEARNER_ROLES`, `FACILITATOR_ROLES`, etc.) not exported. External code must redefine or import, creating DRY violation. |
| **GAP-59** | `app/app/layout.tsx` | 15–28 | No `recordAuditEvent()` call on auth failures (missing userId, null user). Unauthenticated access attempts unlogged. |
| **GAP-60** | `lib/nav/items.ts` | 67–74 | `super_admin` nav items missing `/app/core` and `/app/profile` links present in all other role navs. |
| **GAP-61** | `lib/llm/router.ts` | 21, 33 | No null check on fallback provider response; router could silently return `undefined`. |
| **GAP-62** | `app/api/federation/route.ts` | 54–60 | `FederationTaskEnvelope` fields not validated before passing to `resolveFederationAssignment()` and `dispatchFederationTask()`. |

---

## Low (P3) — Nice-to-Have / Documentation

| ID | File | Issue |
|----|------|-------|
| **GAP-63** | `app/app/layout.tsx:40` | Add inline comment documenting why `adult_learner` is excluded from org-required list. |
| **GAP-64** | `app/app/page.tsx` | Add explicit comment/branch for `student_independent` instead of relying on implicit default fallback. |
| **GAP-65** | `lib/auth/routeAccess.ts` | Replace `as const` inconsistency on role groupings. |
| **GAP-66** | `components/app-shell/AppShell.tsx` | Add `aria-label` to notification and help `<details>/<summary>` elements. |
| **GAP-67** | `components/dashboards/SuperAdminHome.tsx` | Placeholder "—" stats are misleading; show "Loading..." or connect to `/api/super-admin/users` count. |
| **GAP-68** | `lib/observability/trace.ts` | Replace `Date.now() + Math.random()` trace ID with UUID to eliminate (rare) collision risk. |
| **GAP-69** | `lib/ledger/adapter.ts` | Add catch on localStorage quota-exceeded in `upsert()`. |
| **GAP-70** | `lib/runtime/contracts/types.ts` | `RuntimeMission` missing `createdAtIso` field documented in CLAUDE.md section 14. |
| **GAP-71** | `app/api/telemetry/pilot/route.ts` | Document that missing `ROOTWORK_TELEMETRY_INGEST_TOKEN` authorizes ALL requests (intentional dev behavior). |
| **GAP-72** | `scripts/verify-release-gate.mjs` | Add comment/validation that hardcoded check list matches `package.json` verify:* scripts. |

---

## Summary Statistics

| Priority | Count | Action |
|----------|-------|--------|
| P0 Critical | 5 | Fix in this PR before merge |
| P1 High | 13 | Fix in this PR before deploy |
| P2 Medium | 15 | Fix in next sprint PR |
| P3 Low | 10 | Backlog / documentation |
| **Total** | **43** | — |

---

## Issue-to-PR Mapping (Execution Plan)

| PR | Issues | Title |
|----|--------|-------|
| **PR-A** | GAP-30, GAP-48, GAP-62 | `fix(security): add auth guard + input validation to federation route` |
| **PR-B** | GAP-31, GAP-32, GAP-40, GAP-41, GAP-42 | `fix(ledger): resolve shouldUseDbLedger duplication + purge semantics + payload validation` |
| **PR-C** | GAP-35, GAP-36, GAP-37, GAP-38, GAP-39 | `fix(error-handling): wrap all external fetch() and DB init calls in try-catch` |
| **PR-D** | GAP-44, GAP-49 | `fix(security): constant-time token comparison + telemetry route hardening` |
| **PR-E** | GAP-33, GAP-34, GAP-45, GAP-46, GAP-58, GAP-59 | `fix(auth): extract org-required roles + exhaustiveness + routeAccess cleanup` |
| **PR-F** | GAP-43, GAP-54, GAP-55, GAP-61, GAP-68 | `fix(observability): audit reliability + trace header casing + LLM router null checks` |
| **PR-G** | GAP-47, GAP-56, GAP-57 | `fix(ci): smoke test cleanup + verify-role-routes robustness + onboarding selector regex` |
| **PR-H** | GAP-50, GAP-51, GAP-52, GAP-53 | `fix(runtime): add nodejs runtime declarations + diagnostics auth + error logging` |
| **PR-I** | GAP-60, GAP-63–GAP-72 | `fix(ux/docs): super_admin nav links + aria labels + P3 polish + documentation` |

*PRs A–D are security/data-integrity focused — execute first, sequentially.*
*PRs E–H are architectural/reliability — execute after A–D.*
*PR-I is UX/docs polish — execute last.*

---

*Generated: 2026-02-27 — Seventh pass. 43 new gaps identified across security, data integrity, error handling, and reliability layers.*
