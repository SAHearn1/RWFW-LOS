# GitHub Issues Backlog — RootWork LOS

Generated: 2026-02-27 (Updated after second inspection pass)
Status: Accurate as of full codebase re-inspection

---

## Closure Corrections After Re-Inspection

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
**Status:** Open — Needs implementation
**Files:** `lib/ledger/dbAdapter.ts` (new purge fns), `app/api/admin/retention/route.ts` (new)

**Problem:**
Four data lifecycle functions exist but nothing invokes them server-side.
Production DB ledger (`better-sqlite3`) needs server-side purge API.

**Acceptance Criteria:**
- [ ] `lib/ledger/dbAdapter.ts` gains `purgeDbLedgerRecordsBefore()` and `deleteDbLedgerRecordsByLearner()` 
- [ ] `POST /api/admin/retention` accepts `{ action: "purge_before"|"delete_learner", cutoffIso?: string, learnerId?: string }`
- [ ] Requires `admin` or `super_admin` role
- [ ] Audit event logged for each operation
- [ ] Returns `{ purged: number, action, doneAtIso }`
- [ ] `npm run verify:release-gate` passes

---

## Phase 5: UX Polish

### Issue #114 — [GAP-15] Landing page role-specific CTA routing
**Priority:** Low
**Lane:** Lane E (UX backlog)
**Status:** Open — needs product decision

**Problem:** "Teacher Login" and "Admin Info" both route to `/sign-in` with no role hint.

**Acceptance Criteria:**
- [ ] CTAs provide differentiated messaging or routing for teacher/admin personas
- [ ] `npm run verify:release-gate` passes

---

## Status Summary

| Issue | Gap | Status | Priority |
|-------|-----|--------|----------|
| #110 | GAP-27 Data retention admin API | Open — needs implementation | Medium |
| #111 | GAP-28 Standards admin UI | CLOSED — StandardsRegistry exists | — |
| #112 | GAP-13 MCP integration | CLOSED — /api/mcp/health exists | — |
| #113 | GAP-14 Offline mode | CLOSED — /api/offline/status exists | — |
| #114 | GAP-15 Landing CTA routing | Open — low priority UX | Low |
| #115 | GAP-16 Tour steps | CLOSED — teacher/admin have 5 steps | — |
| #116 | GAP-18 Hook warnings | CLOSED — lint clean, 0 warnings | — |

**Remaining actionable work: Issue #110 (GAP-27) only.**
