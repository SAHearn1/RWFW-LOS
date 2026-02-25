---
title: "[#80] Implement Builder screen for facilitator roles"
labels: ["type:feature", "risk:med", "agent:solo", "gap:GAP-09"]
---

## Summary

The `/app/builder` route renders a generic catch-all placeholder. Facilitators need a mission and cohort builder to create and configure the learning structures that learners operate within.

## Problem / Outcome

Teachers have no way to create missions or assemble cohorts from within the app. Without Builder, the facilitator workflow is observation-only — they can review but cannot author.

## Scope

### In Scope
- [ ] Create `app/app/builder/page.tsx` (dedicated route)
- [ ] Create `components/builder/BuilderWorkspace.tsx` — tabbed or sectioned workspace with two panels:
  - **Mission Builder**: form to create a new `RuntimeMission` (title, description, stage defaults to `not_started`) and write it via `dispatchRuntimeEvent`
  - **Cohort Builder**: form to create a new cohort (name, description) with a learner ID input list
- [ ] Role guard: restrict to `FACILITATOR_ROLES`

### Out of Scope
- [ ] Standards alignment for missions (belongs to Standards screen, GAP-08/#81)
- [ ] Assigning missions to cohorts (future scope)
- [ ] Drag-and-drop curriculum sequencing

## Dependencies
- [ ] `lib/runtime/engine/store.ts` — `dispatchRuntimeEvent()` for mission creation events
- [ ] `lib/runtime/contracts/types.ts` — `RuntimeMission` type
- [ ] `lib/auth/routeAccess.ts` — `/app/builder` already defined as facilitator-only
- [ ] #78 (Cohorts) — cohorts created here appear in Cohorts screen

## Acceptance Criteria (Testable)
1. Given a `teacher` user, when they visit `/app/builder`, then they see the builder workspace, not a placeholder.
2. Given a completed Mission Builder form, when the user submits, then a new `RuntimeMission` is written to runtime state.
3. Given a `student_independent` user, when they visit `/app/builder`, then ForbiddenPanel is shown.
4. `npm run lint` passes.
5. `npm run build` passes.

## Files Likely Touched
- `app/app/builder/page.tsx` *(new)*
- `components/builder/BuilderWorkspace.tsx` *(new)*

## Rollback Plan
- Revert strategy: delete `app/app/builder/page.tsx` to fall back to catch-all placeholder
- Data impact: new missions written to runtime state (`localStorage`) — purgeable via `purgeRuntimeStateBefore()`

## Guardrails (Must NOT Change)
- Do not modify `lib/runtime/contracts/types.ts` event type definitions
- Do not modify role access for `/app/builder`
- Do not introduce new frameworks
- Do not edit `app/app/layout.tsx`

## Risk and Agent Mode
- Risk: `risk:med`
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run verify:role-routes`
- Route: `/app/builder` as `teacher` — renders BuilderWorkspace
- Route: `/app/builder` as `student_independent` — ForbiddenPanel
