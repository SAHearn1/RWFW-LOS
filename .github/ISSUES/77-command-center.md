---
title: "[#77] Implement Command Center screen for facilitator roles"
labels: ["type:feature", "risk:med", "agent:solo", "gap:GAP-05"]
---

## Summary

The `/app/command-center` route renders a generic catch-all placeholder. Teacher and PD facilitators need an operational dashboard showing active cohorts, the pickup queue, and the review backlog in a single view.

## Problem / Outcome

Facilitators land on a blank placeholder when they navigate to Command Center. This is the primary operational hub for teachers — without it, they have no centralized view of learner activity requiring their attention.

## Scope

### In Scope
- [ ] Create `app/app/command-center/page.tsx` (dedicated route)
- [ ] Create `components/command-center/CommandCenterDashboard.tsx` — three-panel layout:
  - Active cohorts summary (count + status)
  - Pickup queue (count of pending pickups, links to `/app/pickups`)
  - Review backlog (count of pending reviews, links to `/app/reviews`)
- [ ] Role guard: restrict to `FACILITATOR_ROLES` (`teacher`, `professional_development`)
- [ ] Summary cards with navigation links — no deep data fetching required at this stage

### Out of Scope
- [ ] Full cohort management (GAP-06, #78)
- [ ] Full review queue UI (GAP-07, #79)
- [ ] Full pickups UI (GAP-10, #82)
- [ ] Real-time data or WebSocket connections

## Dependencies
- [ ] `lib/auth/routeAccess.ts` — `/app/command-center` already defined as facilitator-only
- [ ] #78 (Cohorts), #79 (Reviews), #82 (Pickups) — links to these screens

## Acceptance Criteria (Testable)
1. Given a `teacher` user, when they visit `/app/command-center`, then they see the three-panel summary dashboard (not a placeholder).
2. Given a `professional_development` user, the same dashboard renders.
3. Given a `student_independent` user, when they visit `/app/command-center`, then ForbiddenPanel is shown.
4. Each panel card links to the appropriate route (`/app/cohorts`, `/app/reviews`, `/app/pickups`).
5. `npm run lint` passes.
6. `npm run build` passes.

## Files Likely Touched
- `app/app/command-center/page.tsx` *(new)*
- `components/command-center/CommandCenterDashboard.tsx` *(new)*

## Rollback Plan
- Revert strategy: delete `app/app/command-center/page.tsx` to fall back to catch-all placeholder
- Data impact: none (static summary UI, no writes)

## Guardrails (Must NOT Change)
- Do not modify facilitator route access in `lib/auth/routeAccess.ts`
- Do not introduce new frameworks
- Do not edit `app/app/layout.tsx`
- Do not exceed 15 files changed

## Risk and Agent Mode
- Risk: `risk:med`
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run verify:role-routes`
- Route: `/app/command-center` as `teacher` — renders CommandCenterDashboard
- Route: `/app/command-center` as `student_independent` — ForbiddenPanel
