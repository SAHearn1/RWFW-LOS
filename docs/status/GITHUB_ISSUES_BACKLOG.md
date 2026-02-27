# GitHub Issues Backlog — RootWork LOS

Generated: 2026-02-27
Status: Ready for GitHub issue creation

---

## Phase 5: Data Governance

### Issue #110 — [GAP-27] Wire data retention and GDPR deletion hooks
**Priority:** Medium  
**Lane:** Lane B (Data/Observability)  
**Files affected:** `lib/ledger/adapter.ts`, `lib/runtime/engine/store.ts`, `app/api/` (new), possibly `app/app/evidence/page.tsx`

**Problem:**  
Four data lifecycle functions exist but nothing calls them:
- `purgeLedgerRecordsBefore(cutoffIso)` — time-based ledger retention
- `deleteLedgerRecordsByLearner(learnerId)` — GDPR-style learner deletion from ledger
- `purgeRuntimeStateBefore(cutoffIso)` — runtime state retention
- `deleteRuntimeStateByLearner(learnerId)` — GDPR-style runtime state deletion

No UI, API endpoint, admin screen, or scheduled job invokes any of these.

**Acceptance Criteria:**
- [ ] Admin API endpoint `POST /api/admin/retention/purge` accepts `{ type: "ledger"|"runtime", cutoffIso: string }` and calls the appropriate purge function
- [ ] Admin API endpoint `DELETE /api/admin/learner/:learnerId/data` calls both ledger and runtime deletion functions
- [ ] Both endpoints require `admin` or `super_admin` role
- [ ] Audit events logged for all retention operations
- [ ] `npm run verify:release-gate` passes

**Test Plan:**
- Hit `POST /api/admin/retention/purge` with a cutoff date and verify records before it are removed
- Hit `DELETE /api/admin/learner/:id/data` and verify learner records are gone from both ledger and runtime state
- Verify 403 for non-admin roles

---

### Issue #111 — [GAP-28] Standards registry admin UI and editable config
**Priority:** Medium  
**Lane:** Lane E (UX backlog)  
**Files affected:** `app/app/standards/page.tsx`, `lib/standards/verifier/localVerifier.ts`, `app/api/standards/` (new)

**Problem:**  
`DEFAULT_STANDARDS` contains exactly 2 hardcoded standards. The `/app/standards` admin screen exists but has no real content. There is no way for an admin to add, modify, disable, or weight standards through the UI.

**Acceptance Criteria:**
- [ ] Standards admin screen (`/app/standards`) displays the current `DEFAULT_STANDARDS` list
- [ ] Admin can view standard ID, description, and keyword list
- [ ] (Optional enhancement): Admin can add/disable standards via API-backed form
- [ ] `npm run verify:release-gate` passes

**Test Plan:**
- Visit `/app/standards` as `admin` — should see standards list, not placeholder
- Verify `teacher` and `student` roles get 403 from `/app/standards`

---

## Phase 5: Flag Implementations

### Issue #112 — [GAP-13] MCP integration contract and implementation
**Priority:** Medium  
**Lane:** Lane C (Cloud/Federation)  
**Files affected:** `lib/mcp/` (new), `app/api/mcp/` (new)

**Problem:**  
`NEXT_PUBLIC_ENABLE_MCP=true` flag has no corresponding implementation. No contract, no component, no API route.

**Acceptance Criteria:**
- [ ] MCP contract defined in `lib/mcp/contracts.ts`
- [ ] Feature-gated health endpoint at `app/api/mcp/health/route.ts`
- [ ] When flag is `false`, app degrades gracefully (no crash)
- [ ] `.env.example` updated with any new MCP env vars
- [ ] `npm run verify:release-gate` passes

---

### Issue #113 — [GAP-14] Offline mode service worker and ledger sync
**Priority:** Medium  
**Lane:** Lane C (Cloud/Federation)  
**Files affected:** `public/sw.js` (new), `lib/offline/` (new)

**Problem:**  
`NEXT_PUBLIC_ENABLE_OFFLINE=true` flag has no implementation — no service worker, no offline ledger sync strategy.

**Acceptance Criteria:**
- [ ] Service worker contract defined
- [ ] When `NEXT_PUBLIC_ENABLE_OFFLINE=false`, app works as before
- [ ] When enabled, basic offline caching of key routes activated
- [ ] `npm run verify:release-gate` passes

---

## Phase 5: UX Polish

### Issue #114 — [GAP-15] Landing page role-specific CTA routing
**Priority:** Low  
**Lane:** Lane E (UX backlog)  
**Files affected:** `app/page.tsx`

**Problem:**  
"Teacher Login" and "Admin Info" CTAs both route to `/sign-in` with no role hint or differentiated onboarding path.

**Acceptance Criteria:**
- [ ] Teacher CTA routes to `/sign-in?role=teacher` or equivalent
- [ ] Admin CTA routes to `/sign-in?role=admin` or equivalent  
- [ ] OR: landing page CTAs have separate messaging/UX for each persona
- [ ] `npm run verify:release-gate` passes

---

### Issue #115 — [GAP-16] Expand teacher and admin onboarding tour steps
**Priority:** Low  
**Lane:** Lane B (Shell/Nav/Onboarding)  
**Files affected:** `lib/onboarding/tourSteps.ts`

**Problem:**  
Teacher and admin tours have only 3 generic steps. No steps for command-center, cohorts, reviews, builder, or standards screens.

**Acceptance Criteria:**
- [ ] Teacher tour steps added for: command-center, cohorts, reviews
- [ ] Admin tour steps added for: standards, evidence, exports
- [ ] All new steps use `data-tour` selectors that exist in the DOM
- [ ] `npm run verify:onboarding` passes

---

### Issue #116 — [GAP-18] Fix React hook dependency warnings
**Priority:** Low  
**Lane:** Lane E (UX backlog)  
**Files affected:** `components/ple/PLEHome.tsx`, `components/studio/StudioWorkspace.tsx`

**Problem:**  
2 `react-hooks/exhaustive-deps` ESLint warnings in PLEHome and StudioWorkspace add review noise.

**Acceptance Criteria:**
- [ ] Both warnings resolved using `useCallback`/`useMemo` as appropriate
- [ ] No new eslint-disable comments added
- [ ] `npm run lint` passes with 0 warnings
- [ ] `npm run verify:release-gate` passes

---

## Status Summary

| Issue | Gap | Status | Priority |
|-------|-----|--------|----------|
| #110 | GAP-27 Data retention hooks | Needs work | Medium |
| #111 | GAP-28 Standards admin UI | Needs work | Medium |
| #112 | GAP-13 MCP integration | Needs contract | Medium |
| #113 | GAP-14 Offline mode | Needs contract | Medium |
| #114 | GAP-15 Landing CTA routing | Needs work | Low |
| #115 | GAP-16 Tour step expansion | Needs work | Low |
| #116 | GAP-18 Hook warnings | Needs work | Low |

**All critical (GAP-01–02) and high-priority (GAP-03–12, GAP-20–26, GAP-29) gaps are CLOSED.**
