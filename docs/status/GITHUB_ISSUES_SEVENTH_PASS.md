# GitHub Issues — Seventh Pass (2026-02-27)

## PR-A: Security — Federation Route Auth + Validation (GAP-30, GAP-48, GAP-62)

### Issue #130 — [GAP-30] Federation API route has no auth guard
**Priority:** Critical | **Lane:** D
- GET and POST endpoints completely unauthenticated
- Fix: add `currentUser()` check on GET; add `admin`/`super_admin` role guard on POST
- Add `runtime = "nodejs"` declaration (GAP-48)
- Validate `FederationTaskEnvelope` fields before dispatch (GAP-62)

---

## PR-B: Data Integrity — Ledger Correctness (GAP-31, GAP-32, GAP-40, GAP-41, GAP-42)

### Issue #131 — [GAP-31] Duplicate shouldUseDbLedger() with different logic
**Priority:** Critical | **Lane:** C
- `lib/ledger/flags.ts` exports version checking env only
- `lib/ledger/dbAdapter.ts` exports version checking env + path + runtime
- Callers get silently different behavior
- Fix: remove from flags.ts; re-export from dbAdapter

### Issue #132 — [GAP-32] Ledger/runtime purge uses >= instead of < for cutoff
**Priority:** Critical | **Lane:** C
- `lib/ledger/adapter.ts:57` and `lib/runtime/engine/store.ts:44` use `>=`
- CLAUDE.md says "purge_before" = strict `<` (delete everything strictly before)
- dbAdapter.ts correctly uses `<` — in-memory adapters contradict it
- Fix: change both to `record.updatedAtIso < cutoffIso`

### Issue #133 — [GAP-40] isLedgerRecord() doesn't validate payload matches type
**Priority:** High | **Lane:** C
- `app/api/ledger/records/route.ts:23–37` validates shape but not type/payload congruence

### Issue #134 — [GAP-41] dbAdapter toRecord() parses payload as any
**Priority:** High | **Lane:** C
- `lib/ledger/dbAdapter.ts:53` returns unvalidated parsed JSON

### Issue #135 — [GAP-42] adapter.ts upsert() is not atomic
**Priority:** High | **Lane:** C
- Read→filter→push→write not transactional; concurrent writes can lose data

---

## PR-C: Error Handling — Wrap External Calls (GAP-35, GAP-36, GAP-37, GAP-38, GAP-39)

### Issue #136 — [GAP-35] timeline/learner route missing try-catch on DB init
**Priority:** High | **Lane:** C
- `app/api/timeline/learner/route.ts:27` throws unhandled exception on DB failure

### Issue #137 — [GAP-36] super-admin/users route fetch() not wrapped in try-catch
**Priority:** High | **Lane:** A

### Issue #138 — [GAP-37] super-admin/assign-role route fetch() not wrapped in try-catch
**Priority:** High | **Lane:** A

### Issue #139 — [GAP-38] webhooks/clerk route fetch() not wrapped in try-catch
**Priority:** High | **Lane:** A

### Issue #140 — [GAP-39] ledger/records route null dereference on databasePath
**Priority:** High | **Lane:** C
- `availability.databasePath` may be undefined; no null check before `createDbLedgerAdapter()`

---

## PR-D: Security — Token Comparison + Telemetry Hardening (GAP-44, GAP-49)

### Issue #141 — [GAP-44] Bearer token comparison not constant-time in telemetry route
**Priority:** High | **Lane:** E
- `app/api/telemetry/pilot/route.ts:67–73` uses `===` (timing attack)
- Fix: use `crypto.timingSafeEqual()`

### Issue #142 — [GAP-49] telemetry/pilot route missing runtime + JSON error handling
**Priority:** Medium | **Lane:** E
- Missing `runtime = "nodejs"`
- `request.json()` not in try-catch

---

## PR-E: Auth Architecture — Role Logic Centralization (GAP-33, GAP-34, GAP-45, GAP-46, GAP-58, GAP-59)

### Issue #143 — [GAP-33] layout.tsx org-check hardcodes role list inline
**Priority:** Critical | **Lane:** A
- Extract to `ORG_REQUIRED_ROLES` constant in `lib/auth/roles.ts`
- Violates CLAUDE.md guardrail 9

### Issue #144 — [GAP-34] page.tsx role dispatch has no exhaustiveness check
**Priority:** Critical | **Lane:** A
- New roles silently fall through to `<PLEHome />`
- Fix: add explicit `student_independent` branch + exhaustive type guard

### Issue #145 — [GAP-45] middleware.ts unnecessary `as unknown` cast
**Priority:** High | **Lane:** A
- Remove `as unknown` on `clerkProtectedMiddleware` cast

### Issue #146 — [GAP-46] routeAccess.ts ALL_ROLES hardcoded not derived
**Priority:** High | **Lane:** A
- `ALL_ROLES` should be computed from `APP_ROLES as readonly AppRole[]`

### Issue #147 — [GAP-58] routeAccess.ts role groupings not exported
**Priority:** Medium | **Lane:** A
- Export `LEARNER_ROLES`, `FACILITATOR_ROLES`, `ADMIN_ROLE`, `SUPER_ADMIN_ROLE`

### Issue #148 — [GAP-59] layout.tsx missing audit log on auth failures
**Priority:** Medium | **Lane:** A

---

## PR-F: Observability Reliability (GAP-43, GAP-54, GAP-55, GAP-61, GAP-68)

### Issue #149 — [GAP-43] Audit writes are fire-and-forget (events silently lost)
**Priority:** High | **Lane:** E
- `lib/observability/audit.ts` should log failures to stdout before discarding

### Issue #150 — [GAP-54] Audit log path is relative (fails on serverless)
**Priority:** Medium | **Lane:** E
- Change to env var override with explicit absolute fallback

### Issue #151 — [GAP-55] Trace header casing mismatch (code vs docs)
**Priority:** Medium | **Lane:** E
- `trace.ts` uses `"x-rootwork-trace-id"`; CLAUDE.md documents `"X-Trace-Id"`
- Align code to match docs

### Issue #152 — [GAP-61] LLM router missing null check on provider responses
**Priority:** Medium | **Lane:** D
- `lib/llm/router.ts:21,33` can return undefined silently

### Issue #153 — [GAP-68] Trace ID uses Date.now+random (collision risk)
**Priority:** Low | **Lane:** E
- Replace with `crypto.randomUUID()`

---

## PR-G: CI/Verification Scripts (GAP-47, GAP-56, GAP-57)

### Issue #154 — [GAP-47] verify-http-smoke.mjs missing /app/studio + cleanup gap
**Priority:** High | **Lane:** E
- Add `/app/studio` to smoke route list
- Add timeout safety on server startup

### Issue #155 — [GAP-56] verify-role-routes.mjs string matching brittle
**Priority:** Medium | **Lane:** E
- Use more specific regex to avoid comment false positives

### Issue #156 — [GAP-57] verify-onboarding.mjs selector regex doesn't match double quotes
**Priority:** Medium | **Lane:** E

---

## PR-H: Runtime Declarations + Minor API Fixes (GAP-50, GAP-51, GAP-52, GAP-53)

### Issue #157 — [GAP-50] support/diagnostics route missing runtime + needs admin-only auth
**Priority:** Medium | **Lane:** E

### Issue #158 — [GAP-51] health/route.ts missing runtime = "nodejs"
**Priority:** Medium | **Lane:** E

### Issue #159 — [GAP-52] mcp/health and offline/status missing runtime = "nodejs"
**Priority:** Medium | **Lane:** E

### Issue #160 — [GAP-53] store.ts JSON.parse failure silently discards all user data
**Priority:** Medium | **Lane:** C

---

## PR-I: UX / Nav / Docs Polish (GAP-60, GAP-63–GAP-72)

### Issue #161 — [GAP-60] super_admin nav missing /app/core and /app/profile
**Priority:** Medium | **Lane:** B

### Issue #162 — [GAP-63–72] P3 polish: aria labels, SuperAdminHome stats, comments, UUID trace
**Priority:** Low | **Lane:** B/E

---

## Status Summary

> Last updated: 2026-02-27 (ninth pass). All issues now closed.

| Issue | Gap | Priority | Status | Closed in |
|-------|-----|----------|--------|-----------|
| #130 | GAP-30 Federation auth | Critical | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #131 | GAP-31 shouldUseDbLedger dupe | Critical | ✅ CLOSED | seventh-pass + eighth-pass |
| #132 | GAP-32 Purge semantics | Critical | ✅ CLOSED | confirmed correct — no fix needed |
| #133 | GAP-40 isLedgerRecord payload | High | ✅ CLOSED | eighth-pass (`711b332`) |
| #134 | GAP-41 toRecord() any cast | High | ✅ CLOSED | eighth-pass (`711b332`) |
| #135 | GAP-42 upsert atomicity | High | ✅ CLOSED | confirmed correct — SQLite ON CONFLICT |
| #136 | GAP-35 timeline try-catch | High | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #137 | GAP-36 users fetch try-catch | High | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #138 | GAP-37 assign-role fetch try-catch | High | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #139 | GAP-38 webhook fetch try-catch | High | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #140 | GAP-39 ledger null dereference | High | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #141 | GAP-44 timing attack | High | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #142 | GAP-49 telemetry runtime | Medium | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #143 | GAP-33 layout org list | Critical | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #144 | GAP-34 page exhaustiveness | Critical | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #145 | GAP-45 middleware cast | High | ✅ CLOSED | seventh-pass — comment added |
| #146 | GAP-46 ALL_ROLES derived | High | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #147 | GAP-58 export role groupings | Medium | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #148 | GAP-59 layout audit log | Medium | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #149 | GAP-43 audit fire-and-forget | High | ✅ CLOSED | confirmed correct — `.catch()` logs to stdout |
| #150 | GAP-54 audit log path | Medium | ✅ CLOSED | ninth-pass — `AUDIT_LOG_PATH` env var |
| #151 | GAP-55 trace header casing | Medium | ✅ CLOSED | confirmed correct — `x-rootwork-trace-id` |
| #152 | GAP-61 LLM router null | Medium | ✅ CLOSED | ninth-pass — try-catch + null guard |
| #153 | GAP-68 trace ID UUID | Low | ✅ CLOSED | eighth-pass (`711b332`) |
| #154 | GAP-47 smoke test | High | ✅ CLOSED | confirmed correct — routes already covered |
| #155 | GAP-56 role-routes brittle | Medium | ✅ CLOSED | ninth-pass — regex helpers |
| #156 | GAP-57 onboarding regex | Medium | ✅ CLOSED | confirmed correct — handles both quote styles |
| #157 | GAP-50 diagnostics auth | Medium | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #158 | GAP-51 health runtime | Medium | ✅ CLOSED | ninth-pass — `runtime = "nodejs"` |
| #159 | GAP-52 mcp/offline runtime | Medium | ✅ CLOSED | ninth-pass — `runtime = "nodejs"` |
| #160 | GAP-53 store.ts silent discard | Medium | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #161 | GAP-60 super_admin nav | Medium | ✅ CLOSED | seventh-pass (`10ca84a`) |
| #162 | GAP-63–72 P3 polish | Low | ✅ CLOSED | eighth-pass (`711b332`) |
