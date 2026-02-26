# RootWork LOS — Full Ticket Backlog
_Gap-driven, agent-swarm executable. All gaps from CLAUDE.md §12 + typecheck gate unblock._

**Last Updated:** 2026-02-26
**Branch:** `claude/gap-analysis-user-roles-RHg64`
**Status tracking:** Each ticket lists wave, lane, owner-agent, and completion state.

---

## Swarm Execution Rules (enforced by agents)

1. **No parallel PR may edit `app/app/layout.tsx` or `app/layout.tsx`.**
2. **Max 15 files per PR** unless documented in PR body.
3. **Contract before implementation** — define types/constants in `lib/` first.
4. **Every new route** must update: `routeAccess.ts` + `role-matrix.md` + `nav/items.ts`.
5. **Every new env var** must be added to `.env.example`.
6. **Feature flags default false** — never crash when disabled.
7. **No ad hoc role logic** — all role decisions flow from `lib/auth/routeAccess.ts`.

---

## WAVE 0 — Gate Unblock (serial, must complete first)

| # | Title | GAP | Files | Status |
|---|-------|-----|-------|--------|
| 84 | fix: Clear stale .next types + create stub pages for all missing routes | — | `.next`, `app/app/{missions,portfolio,command-center,cohorts,reviews,builder,standards,pickups}/page.tsx`, `app/app/super-admin/{institutions,licenses,teachers,users}/page.tsx`, `app/admin-info/page.tsx`, `app/api/{inference,missions,ledger/records,orchestration/worker-run,admin/data-retention/learner,admin/data-retention/purge,ai/health,mcp/health,offline/status,support/diagnostics,telemetry/pilot,timeline/learner}/route.ts` | [ ] |

**Acceptance:** `npm run typecheck` exits 0. `npm run lint` exits 0. `npm run verify:release-gate` passes.

---

## WAVE 1 — Screen Implementations + System Wiring (parallel lanes)

### Lane B — Screen Implementations

| # | Title | GAP | Lane | Status |
|---|-------|-----|------|--------|
| 85 | feat(missions): Implement Missions screen with mission list + launch flow | GAP-03 | B1 | [ ] |
| 86 | feat(portfolio): Implement Portfolio screen with artifact gallery + credential progress | GAP-04 | B1 | [ ] |
| 87 | feat(command-center): Implement Command Center facilitator dashboard | GAP-05 | B2 | [ ] |
| 88 | feat(cohorts): Implement Cohorts management screen | GAP-06 | B2 | [ ] |
| 89 | feat(reviews): Implement artifact review queue screen | GAP-07 | B2 | [ ] |
| 90 | feat(builder): Implement mission/cohort Builder screen | GAP-09 | B2 | [ ] |
| 91 | feat(pickups): Implement Pickups screen with NEXT_PUBLIC_ENABLE_PICKUP flag gate | GAP-10 | B2 | [ ] |
| 92 | feat(standards): Implement Standards admin registry screen | GAP-08 | B3 | [ ] |
| 93 | feat(super-admin): Implement super-admin screens — institutions, licenses, teachers, users | — | B3 | [ ] |
| 94 | feat(admin-info): Implement public /admin-info landing page | — | B3 | [ ] |

**Acceptance per ticket:** Route renders for correct roles, 403 for forbidden roles, tour selectors present, lint + typecheck clean.

### Lane C/D — System Wiring

| # | Title | GAP | Lane | Status |
|---|-------|-----|------|--------|
| 95 | fix(ledger): Wire shouldUseDbLedger() into StudioWorkspace, CredentialsSummary, AdminEvidenceView | GAP-11 | C | [ ] |
| 96 | fix(catchall): Remove unreachable /core and /forbidden branches from catch-all | GAP-12 | B | [ ] |
| 97 | fix(audit): Replace appendFileSync with /tmp write + structured log drain contract | GAP-24 | D | [ ] |
| 98 | feat(webhook): Handle user.created / user.updated / session.created in Clerk webhook | GAP-25 | A | [ ] |
| 99 | fix(standards-plugin): Wire runStandardsPlugins() into StudioWorkspace verification | GAP-26 | C | [ ] |
| 100 | fix(react-hooks): Resolve exhaustive-deps warnings in PLEHome + StudioWorkspace | GAP-18 | C | [ ] |

### Lane E — Documentation

| # | Title | GAP | Lane | Status |
|---|-------|-----|------|--------|
| 101 | docs(role-matrix): Add all missing routes to docs/qa/role-matrix.md | GAP-20 | E | [ ] |

---

## WAVE 2 — API Implementations

| # | Title | GAP | Lane | Status |
|---|-------|-----|------|--------|
| 102 | feat(api-inference): Implement /api/inference wiring ModelRouter (Ollama + cloud) | GAP-22 | D | [ ] |
| 103 | feat(api-missions): Implement /api/missions CRUD endpoint | — | C | [ ] |
| 104 | feat(api-ledger): Implement /api/ledger/records read endpoint | — | C | [ ] |
| 105 | feat(api-orchestration): Implement /api/orchestration/worker-run job submission | GAP-23 | D | [ ] |
| 106 | feat(api-data-retention): Implement /api/admin/data-retention/learner + /purge | GAP-27 | A | [ ] |
| 107 | feat(api-monitoring): Implement /api/ai/health, /api/mcp/health, /api/offline/status, /api/support/diagnostics, /api/telemetry/pilot, /api/timeline/learner | — | D | [ ] |
| 108 | feat(federation-dispatch): Implement real agent registry lookup + capability routing in /api/federation | GAP-29 | D | [ ] |

---

## WAVE 3 — Polish + Verification

| # | Title | GAP | Lane | Status |
|---|-------|-----|------|--------|
| 109 | feat(onboarding): Expand teacher + admin tour steps for command-center, cohorts, standards | GAP-16 | B | [ ] |
| 110 | docs: Update CLAUDE.md gap statuses to reflect all completed fixes | — | E | [ ] |
| 111 | test: Run full e2e role matrix + gap analysis — iterate until all green | — | E | [ ] |

---

## Collision Prevention Map

| File | Locked by wave/ticket |
|------|-----------------------|
| `app/app/layout.tsx` | ONE agent at a time only |
| `app/layout.tsx` | ONE agent at a time only |
| `lib/auth/routeAccess.ts` | Wave 0 only (then read-only) |
| `lib/nav/items.ts` | Wave 1C (B3) |
| `docs/qa/role-matrix.md` | Wave 1E (#101) |
| `components/studio/StudioWorkspace.tsx` | Wave 1D (#99, #100) |
| `app/api/webhooks/clerk/route.ts` | Wave 1D (#98) |
| `lib/ledger/adapter.ts` | Wave 1D (#95) |
| `lib/observability/audit.ts` | Wave 1D (#97) |

---

## Completion Criteria (Definition of Done)

- [ ] `npm run lint` → exit 0
- [ ] `npm run typecheck` → exit 0
- [ ] `npm run build` → exit 0
- [ ] `npm run verify:release-gate` → passed
- [ ] `npm run verify:role-routes` → passed
- [ ] `npm run verify:onboarding` → passed
- [ ] All 6 roles: home dashboard renders correctly
- [ ] All 6 roles: nav items render, forbidden routes show 403
- [ ] e2e gap analysis: zero red items
