# GitHub Issues Backlog — RootWork LOS

Generated: 2026-02-27 (Updated after fifth inspection pass)
Status: Accurate as of full codebase re-inspection (third pass)

---

## Closure Corrections After Re-Inspection (Pass 2)

The following issues were listed as open in the initial backlog but were found to already be resolved:

| Issue | Gap | Finding |
|-------|-----|---------|
| #111 | GAP-28 Standards admin UI | **CLOSED** — `StandardsRegistry` shows real `DEFAULT_STANDARDS` table |
| #112 | GAP-13 MCP integration | **CLOSED** (minimal) — `/api/mcp/health` returns graceful 503 when disabled |
| #113 | GAP-14 Offline mode | **CLOSED** (minimal) — `/api/offline/status` returns graceful 503 when disabled |
| #115 | GAP-16 Tour steps | **CLOSED** — Teacher has 5 role-specific steps; Admin has 5 role-specific steps |
| #116 | GAP-18 Hook warnings | **CLOSED** — `npm run lint` passes with zero warnings |

---

## Phase 5: Data Governance

### Issue #110 — [GAP-27] Wire data retention admin API endpoints
**Priority:** Medium — Production safety (GDPR/retention compliance)
**Lane:** Lane B (Data/Observability)
**Status:** ✅ **CLOSED** — Implemented in commit `7f9a3f3`

**Resolution:**
- `lib/ledger/dbAdapter.ts` gains `purgeDbLedgerRecordsBefore()` and `deleteDbLedgerRecordsByLearner()`
- `POST /api/admin/retention` wired with `admin` / `super_admin` role gate + audit logging

---

## Phase 6: Super-Admin Clerk Integration

### Issue #117 — [GAP-NEW-2] User Roster shows scaffold demo data only
**Priority:** High
**Lane:** Lane A (Auth/Security)
**Status:** ✅ **CLOSED** — Implemented in current pass

**Resolution:**
- `GET /api/super-admin/users` created — fetches live user list from Clerk Management API
- `UserRoster` component updated to use `useEffect` fetch with loading/error states

### Issue #118 — [GAP-NEW-1] Teacher role assignments not synced to Clerk
**Priority:** High
**Lane:** Lane A (Auth/Security)
**Status:** ✅ **CLOSED** — Implemented in current pass

**Resolution:**
- `POST /api/super-admin/assign-role` created — PATCH Clerk publicMetadata with new role + audit log
- `TeacherAssignment` component updated: after local store write, calls assign-role API, shows sync result

### Issue #119 — [GAP-NEW-12] BuilderWorkspace buttons have no handlers
**Priority:** Medium
**Lane:** Lane E (UX backlog)
**Status:** ✅ **CLOSED** — Implemented in current pass

**Resolution:**
- `BuilderWorkspace` now has full controlled state for mission title/objective and cohort name/learners
- Validation with error messages; success confirmation on valid submit; form resets after success

### Issue #120 — [GAP-17 Doc Error] student_enrolled org check documented as not enforced
**Priority:** Documentation fix
**Status:** ✅ **CLOSED** — `app/app/layout.tsx:40` already includes `student_enrolled` in org check;
CLAUDE.md and PROGRAM_STATUS.md corrected to reflect actual code

---

## Phase 6: UX Polish

### Issue #114 — [GAP-15] Landing page role-specific CTA routing
**Priority:** Low
**Lane:** Lane E (UX backlog)
**Status:** Open — needs product decision

**Problem:** "Teacher Login" routes to `/sign-in` with no role hint. "Admin Info" routes to `/admin-info` (informational page).

**Acceptance Criteria:**
- [ ] Teacher CTA either passes a role hint query param or sets a cookie so post-login role assignment is smoother
- [ ] `npm run verify:release-gate` passes
- **Note:** Requires product decision on role-prefill strategy before implementation

---

## Status Summary

| Issue | Gap | Status | Priority |
|-------|-----|--------|----------|
| #110 | GAP-27 Data retention admin API | ✅ CLOSED | — |
| #111 | GAP-28 Standards admin UI | ✅ CLOSED | — |
| #112 | GAP-13 MCP integration | ✅ CLOSED | — |
| #113 | GAP-14 Offline mode | ✅ CLOSED | — |
| #114 | GAP-15 Landing CTA routing | Open — low priority UX | Low |
| #115 | GAP-16 Tour steps | ✅ CLOSED | — |
| #116 | GAP-18 Hook warnings | ✅ CLOSED | — |
| #117 | GAP-NEW-2 User roster live data | ✅ CLOSED | — |
| #118 | GAP-NEW-1 Teacher role Clerk sync | ✅ CLOSED | — |
| #119 | GAP-NEW-12 Builder form handlers | ✅ CLOSED | — |
| #120 | GAP-17 doc error correction | ✅ CLOSED | — |

**Remaining actionable work: Issue #114 (GAP-15) only — awaiting product decision.**
