---
title: "[#78] Implement Cohorts screen for facilitator roles"
labels: ["type:feature", "risk:med", "agent:solo", "gap:GAP-06"]
---

## Summary

The `/app/cohorts` route renders a generic catch-all placeholder. Facilitators (`teacher`, `professional_development`) need a cohort list view showing enrolled learners, assignment controls, and cohort health indicators.

## Problem / Outcome

Teachers have no way to view or manage the groups of learners they are responsible for. Cohort management is foundational to the facilitator workflow — without it, Command Center (#77) and Reviews (#79) have no organizational context.

## Scope

### In Scope
- [ ] Create `app/app/cohorts/page.tsx` (dedicated route)
- [ ] Create `components/cohorts/CohortList.tsx` — list of cohorts with learner count and status badge
- [ ] Create `components/cohorts/CohortCard.tsx` — individual cohort card with name, learner count, active missions count
- [ ] Role guard: restrict to `FACILITATOR_ROLES`
- [ ] Empty state for facilitators with no assigned cohorts

### Out of Scope
- [ ] Cohort creation (that belongs to Builder, GAP-09/#80)
- [ ] Individual learner deep-dives
- [ ] Real-time cohort data from an external service

## Dependencies
- [ ] `lib/auth/routeAccess.ts` — `/app/cohorts` already defined as facilitator-only
- [ ] #77 (Command Center) — cross-links from cohort panel
- [ ] #80 (Builder) — cohort creation entry point

## Acceptance Criteria (Testable)
1. Given a `teacher` user, when they visit `/app/cohorts`, then they see a cohort list (or empty state), not a placeholder.
2. Given a `student_independent` user, when they visit `/app/cohorts`, then ForbiddenPanel is shown.
3. Each cohort card shows at minimum: cohort name, learner count placeholder, status.
4. `npm run lint` passes.
5. `npm run build` passes.
6. `npm run verify:role-routes` passes.

## Files Likely Touched
- `app/app/cohorts/page.tsx` *(new)*
- `components/cohorts/CohortList.tsx` *(new)*
- `components/cohorts/CohortCard.tsx` *(new)*

## Rollback Plan
- Revert strategy: delete `app/app/cohorts/page.tsx` to fall back to catch-all placeholder
- Data impact: none (static/mock data at this stage)

## Guardrails (Must NOT Change)
- Do not modify `lib/auth/routeAccess.ts`
- Do not introduce new frameworks or external data services
- Do not edit `app/app/layout.tsx`

## Risk and Agent Mode
- Risk: `risk:med`
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run verify:role-routes`
- Route: `/app/cohorts` as `teacher` — renders CohortList
- Route: `/app/cohorts` as `student_independent` — ForbiddenPanel
