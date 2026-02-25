---
title: "[#82] Implement Pickups screen with NEXT_PUBLIC_ENABLE_PICKUP flag gate"
labels: ["type:feature", "risk:med", "agent:solo", "gap:GAP-10"]
---

## Summary

The `/app/pickups` route renders a generic catch-all placeholder. The `NEXT_PUBLIC_ENABLE_PICKUP` feature flag is defined but is never checked in the Pickups route. Facilitators need a pickup assignment UI, and the flag gate must be enforced.

## Problem / Outcome

The feature flag `NEXT_PUBLIC_ENABLE_PICKUP` exists and is documented but has no effect — the route never checks it. This breaks the graceful degradation contract: flag-off must show a clear "feature not enabled" message, not a generic placeholder.

## Scope

### In Scope
- [ ] Create `app/app/pickups/page.tsx` (dedicated route)
- [ ] Create `components/pickups/PickupsWorkspace.tsx`:
  - When `NEXT_PUBLIC_ENABLE_PICKUP=true`: render pickup assignment UI — list of available pickups with assign/unassign controls
  - When `NEXT_PUBLIC_ENABLE_PICKUP=false`: render a "Pickups feature is not enabled" message (graceful disabled state)
- [ ] Role guard: restrict to `FACILITATOR_ROLES`
- [ ] Import `phase1FeatureFlags` from `lib/config/featureFlags.ts` to read the flag

### Out of Scope
- [ ] Backend pickup persistence (local state only at this stage)
- [ ] Integration with cohort assignment (future scope)

## Dependencies
- [ ] `lib/config/featureFlags.ts` — `phase1FeatureFlags.enablePickup` (already defined)
- [ ] `lib/auth/routeAccess.ts` — `/app/pickups` already defined as facilitator-only
- [ ] #77 (Command Center) — pickup queue count links here
- [ ] #78 (Cohorts) — pickups reference cohort context

## Acceptance Criteria (Testable)
1. Given `NEXT_PUBLIC_ENABLE_PICKUP=true` and a `teacher` user, when they visit `/app/pickups`, then the pickup assignment UI renders (not a placeholder).
2. Given `NEXT_PUBLIC_ENABLE_PICKUP=false` (or unset), when a `teacher` visits `/app/pickups`, then a graceful "Pickups feature is not enabled" message renders — no crash, no generic placeholder.
3. Given a `student_independent` user, when they visit `/app/pickups`, then ForbiddenPanel is shown.
4. `npm run lint` passes.
5. `npm run build` passes.
6. `npm run verify:role-routes` passes.

## Files Likely Touched
- `app/app/pickups/page.tsx` *(new)*
- `components/pickups/PickupsWorkspace.tsx` *(new)*
- `docs/qa/role-matrix.md` *(add missing `/app/pickups` row — partial fix for GAP-20)*

## Rollback Plan
- Feature flag: set `NEXT_PUBLIC_ENABLE_PICKUP=false` to disable UI without code change
- Revert strategy: delete `app/app/pickups/page.tsx` to fall back to catch-all placeholder
- Data impact: none (local state only)

## Guardrails (Must NOT Change)
- Do not modify `lib/config/featureFlags.ts` flag definitions
- Do not modify facilitator route access for `/app/pickups`
- Do not introduce new frameworks
- Do not edit `app/app/layout.tsx`

## Risk and Agent Mode
- Risk: `risk:med`
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run verify:role-routes`
- Route: `/app/pickups` as `teacher` with flag true — renders PickupsWorkspace
- Route: `/app/pickups` as `teacher` with flag false — graceful disabled message
- Route: `/app/pickups` as `student_independent` — ForbiddenPanel
