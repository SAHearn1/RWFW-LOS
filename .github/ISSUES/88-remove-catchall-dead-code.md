# [#88] CHORE: Remove unreachable dead code from catch-all (GAP-12)

## Problem
`app/app/[[...slug]]/page.tsx` contains two unreachable branches:
- Lines handling `/app/core` — the dedicated `app/app/core/page.tsx` always
  takes App Router priority; the catch-all branch is never reached.
- Lines handling `/app/forbidden` — same reason; `app/app/forbidden/page.tsx`
  is the actual handler.

These branches mislead future developers into thinking the catch-all is
responsible for these routes.

## Scope
Lane E — CI/Release/Docs

## Expected behaviour
After this change, the catch-all handles only:
1. `notFound()` for unknown paths
2. `ForbiddenPanel` for role mismatches
3. Profile inline render
4. Generic placeholder for known-but-unimplemented routes

## Files to modify
| File | Action |
|------|--------|
| `app/app/[[...slug]]/page.tsx` | MODIFY — delete dead `/app/core` and `/app/forbidden` branches |

## Acceptance criteria
- [ ] Dead branches removed
- [ ] `npm run lint && npm run typecheck && npm run build` pass
- [ ] `npm run verify:role-routes` passes

## File budget
≤ 1 file changed

## Rollback
`git revert` the single commit.
