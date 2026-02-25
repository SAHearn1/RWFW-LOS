# [#89] CHORE: Fix React hook exhaustive-deps warnings (GAP-18)

## Problem
Two pre-existing `react-hooks/exhaustive-deps` ESLint warnings exist:
- `components/ple/PLEHome.tsx`
- `components/studio/StudioWorkspace.tsx`

These are non-blocking but add noise to every lint run and will grow into bugs
if the components are extended.

## Scope
Lane C — Runtime/Ledger/Standards (component layer)

## Expected behaviour
- Dependent values inside `useEffect` callbacks are either wrapped in
  `useCallback`/`useMemo` at the call site or added to the dependency array
  with a comment explaining any intentional omission.
- No `// eslint-disable` suppressions — fix the root cause.
- Behaviour of both components is unchanged.

## Files to modify
| File | Action |
|------|--------|
| `components/ple/PLEHome.tsx` | MODIFY — fix exhaustive-deps |
| `components/studio/StudioWorkspace.tsx` | MODIFY — fix exhaustive-deps |

## Acceptance criteria
- [ ] `npm run lint` produces zero `react-hooks/exhaustive-deps` warnings
- [ ] `npm run typecheck` passes
- [ ] PLEHome and StudioWorkspace behave identically to before

## File budget
≤ 2 files changed

## Rollback
`git revert` the single commit.
