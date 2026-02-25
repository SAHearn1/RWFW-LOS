---
title: "[#79] Implement Reviews screen for facilitator roles"
labels: ["type:feature", "risk:med", "agent:solo", "gap:GAP-07"]
---

## Summary

The `/app/reviews` route renders a generic catch-all placeholder. Facilitators need an artifact review queue where they can triage learner submissions and submit verdicts (approve / return / flag).

## Problem / Outcome

Submitted artifacts have no pathway for facilitator feedback. Without Reviews, the mission lifecycle is incomplete — learners can submit but cannot receive a verdict, blocking credential progression.

## Scope

### In Scope
- [ ] Create `app/app/reviews/page.tsx` (dedicated route)
- [ ] Create `components/reviews/ReviewQueue.tsx` — list of submitted artifacts awaiting review, sourced from ledger records with `type: "artifact"` and mission stage `submitted`
- [ ] Create `components/reviews/ReviewCard.tsx` — individual submission card with artifact content preview and verdict action buttons (Approve / Return / Flag)
- [ ] Verdict buttons dispatch a `VERIFICATION_COMPLETED` runtime event via `dispatchRuntimeEvent()`
- [ ] Role guard: restrict to `FACILITATOR_ROLES`
- [ ] Empty state when review queue is empty

### Out of Scope
- [ ] Inline artifact editing by facilitators
- [ ] Notification system for learners
- [ ] Bulk review actions

## Dependencies
- [ ] `lib/runtime/engine/store.ts` — `readRuntimeState()`, `dispatchRuntimeEvent()`
- [ ] `lib/ledger/adapter.ts` — `localLedgerAdapter.readAll()` to source submitted artifacts
- [ ] `NEXT_PUBLIC_ENABLE_LEDGER` — component degrades gracefully when false
- [ ] `lib/auth/routeAccess.ts` — `/app/reviews` already defined as facilitator-only
- [ ] #77 (Command Center) — Review backlog count links here

## Acceptance Criteria (Testable)
1. Given a `teacher` user, when they visit `/app/reviews`, then they see the review queue (or empty state), not a placeholder.
2. Given a submitted artifact in the ledger, it appears in the queue with approve/return/flag controls.
3. Given `NEXT_PUBLIC_ENABLE_LEDGER=false`, the screen shows a graceful disabled message (no crash).
4. Given a `student_independent` user, when they visit `/app/reviews`, then ForbiddenPanel is shown.
5. `npm run lint` passes.
6. `npm run build` passes.

## Files Likely Touched
- `app/app/reviews/page.tsx` *(new)*
- `components/reviews/ReviewQueue.tsx` *(new)*
- `components/reviews/ReviewCard.tsx` *(new)*

## Rollback Plan
- Revert strategy: delete `app/app/reviews/page.tsx` to fall back to catch-all placeholder
- Data impact: read-only ledger reads; verdict dispatch only writes runtime state

## Guardrails (Must NOT Change)
- Do not modify `lib/runtime/contracts/types.ts` event types
- Do not modify `lib/ledger/adapter.ts`
- Do not introduce new frameworks
- Do not edit `app/app/layout.tsx`

## Risk and Agent Mode
- Risk: `risk:med`
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run verify:role-routes`
- Route: `/app/reviews` as `teacher` — renders ReviewQueue
- Route: `/app/reviews` as `student_independent` — ForbiddenPanel
