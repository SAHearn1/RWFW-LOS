# [#86] FEATURE: Cohort learner membership management

## Problem
`CohortList` / `CohortCard` show three hardcoded demo cohorts with no
interaction. Teachers in a trial evaluation cannot associate real learners with
a cohort, making the facilitator experience impossible to evaluate.

## Scope
Lane C — Runtime/Ledger/Standards

## Expected behaviour
- A lightweight `lib/cohorts/store.ts` module persists cohort records (name,
  status, learner IDs) in localStorage (client) — same pattern as
  `lib/licensing/store.ts`.
- `CohortList` renders stored cohorts; provides a "New Cohort" form (name field
  + Create button).
- `CohortCard` shows live learner count and a text-area to add/remove learner
  email or user IDs (comma-separated), with a Save button.
- Deleting a cohort is allowed from the card.
- Empty state: "No cohorts yet. Create one above."

## Files to create / modify
| File | Action |
|------|--------|
| `lib/cohorts/store.ts` | NEW — localStorage-backed cohort store |
| `lib/cohorts/types.ts` | NEW — CohortRecord type |
| `components/cohorts/CohortList.tsx` | MODIFY — use store, add create form |
| `components/cohorts/CohortCard.tsx` | MODIFY — show live learner count, add/remove members |

## Acceptance criteria
- [ ] Teacher can create a named cohort; it persists across page navigations
- [ ] Teacher can add learner IDs to a cohort and save
- [ ] Cohort card shows learner count
- [ ] Teacher can delete a cohort
- [ ] `npm run lint && npm run typecheck` pass

## File budget
≤ 5 files changed / created

## Rollback
Delete `lib/cohorts/`; revert `CohortList.tsx` and `CohortCard.tsx`.
