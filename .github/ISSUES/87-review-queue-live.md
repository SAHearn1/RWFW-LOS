# [#87] FEATURE: Review queue connected to real learner ledger submissions

## Problem
`ReviewQueue` / `ReviewCard` show three hardcoded demo review items. Teachers
cannot see actual artifacts submitted by learners, making the review workflow
undemonstrable in a trial.

## Scope
Lane C — Runtime/Ledger/Standards

## Expected behaviour
- A `lib/reviews/store.ts` module persists review verdicts in localStorage.
- `ReviewQueue` calls `GET /api/ledger/records` and filters for
  `type === "artifact"` records, treating each as a pending review item unless
  a verdict is already stored.
- Each `ReviewCard` shows: learner ID, artifact content preview (≤ 200 chars),
  saved-at date, and Approve / Return / Flag action buttons.
- On action: a verdict record is stored in `lib/reviews/store.ts` and the
  card is removed from the pending queue (or marked with the verdict).
- Empty state: "No submissions pending review."
- Do NOT modify `StudioWorkspace` or any ledger adapter.

## Files to create / modify
| File | Action |
|------|--------|
| `lib/reviews/store.ts` | NEW — localStorage-backed verdict store |
| `lib/reviews/types.ts` | NEW — ReviewVerdict type |
| `components/reviews/ReviewQueue.tsx` | MODIFY — fetch from ledger API, filter pending |
| `components/reviews/ReviewCard.tsx` | MODIFY — show real data, wire verdict buttons |

## Acceptance criteria
- [ ] ReviewQueue fetches ledger records and shows artifact records as review items
- [ ] Approve / Return / Flag store a verdict and remove the item from pending
- [ ] Empty state shown when no pending reviews
- [ ] `npm run lint && npm run typecheck` pass
- [ ] **Do not modify** `StudioWorkspace.tsx`, `lib/ledger/adapter.ts`,
      or any route page

## File budget
≤ 5 files changed / created

## Rollback
Delete `lib/reviews/`; revert `ReviewQueue.tsx` and `ReviewCard.tsx`.
