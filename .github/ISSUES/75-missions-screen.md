---
title: "[#75] Implement Missions screen for learner roles"
labels: ["type:feature", "risk:med", "agent:solo", "gap:GAP-03"]
---

## Summary

The `/app/missions` route currently renders a generic catch-all placeholder. Learner roles (`student_independent`, `student_enrolled`, `adult_learner`) need a real Missions screen with a mission list, launch flow, and lifecycle action controls (start, submit).

## Problem / Outcome

Learners have Missions in their nav but land on an empty placeholder with no actionable content. This blocks the core learning loop: mission → studio → artifact → credential.

## Scope

### In Scope
- [ ] Create `app/app/missions/page.tsx` (dedicated route — takes App Router priority over catch-all)
- [ ] Create `components/missions/MissionsList.tsx` — list of missions from `readRuntimeState()`
- [ ] Mission lifecycle action buttons: Start, Submit (dispatch runtime events via `dispatchRuntimeEvent`)
- [ ] Role guard: restrict to `LEARNER_ROLES` (matches route access contract)
- [ ] Empty state for learners with no missions yet

### Out of Scope
- [ ] Mission creation UI (that belongs to Builder, GAP-09)
- [ ] Teacher/admin views of missions
- [ ] Backend API changes

## Dependencies
- [ ] `lib/runtime/engine/store.ts` — `readRuntimeState()`, `dispatchRuntimeEvent()` (already implemented)
- [ ] `lib/runtime/contracts/types.ts` — `RuntimeMission` type (already implemented)
- [ ] `lib/auth/routeAccess.ts` — `/app/missions` already defined as learner-only

## Acceptance Criteria (Testable)
1. Given a `student_independent` user, when they visit `/app/missions`, then they see a mission list (or empty state), not a placeholder.
2. Given a mission in `in_progress` state, when the user clicks Submit, then `dispatchRuntimeEvent` is called with a submit event.
3. Given a `teacher` user, when they visit `/app/missions`, they are redirected or shown ForbiddenPanel (route access enforced).
4. `npm run lint` passes.
5. `npm run build` passes.
6. `npm run verify:role-routes` passes.

## Files Likely Touched
- `app/app/missions/page.tsx` *(new)*
- `components/missions/MissionsList.tsx` *(new)*
- `docs/qa/role-matrix.md` *(if row is missing — verify)*

## Rollback Plan
- Feature flag: none needed — dedicated page replaces placeholder, placeholder still exists in catch-all as fallback
- Revert strategy: delete `app/app/missions/page.tsx` to fall back to catch-all placeholder
- Data impact: none (reads existing runtime state only)

## Guardrails (Must NOT Change)
- Do not modify `lib/auth/routeAccess.ts` role assignments for `/app/missions`
- Do not change runtime event types in `lib/runtime/contracts/types.ts`
- Do not introduce new frameworks
- Do not edit `app/app/layout.tsx`

## Risk and Agent Mode
- Risk: `risk:med`
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run verify:role-routes`
- Route: `/app/missions` as `student_independent` — renders mission list
- Route: `/app/missions` as `teacher` — renders ForbiddenPanel
