# [#84] FEATURE: Server-backed mission persistence API

## Problem
All mission data is stored exclusively in `localStorage`. Any learner who
clears their browser, switches devices, or uses an incognito session loses all
progress. This makes trial evaluation unreliable — schools cannot assess
learning continuity.

## Scope
Lane C — Runtime/Ledger/Standards

## Expected behaviour
- An in-memory server-side store holds missions for the lifetime of the server
  process (suitable for trial evaluation; production will use Vercel KV / DB).
- `MissionsList` (`components/missions/MissionsList.tsx`) creates, lists, and
  deletes missions via `GET /api/missions` and `POST /api/missions` rather than
  directly mutating localStorage.
- The API route reads/writes from the server-side store (singleton module).
- localStorage is used as a client-side cache only; API is authoritative.

## Files to create / modify
| File | Action |
|------|--------|
| `lib/runtime/missionStore.ts` | NEW — singleton in-memory mission store |
| `app/api/missions/route.ts` | NEW — GET (list) + POST (create/delete) |
| `components/missions/MissionsList.tsx` | MODIFY — fetch from API, degrade gracefully |

## Acceptance criteria
- [ ] `GET /api/missions` returns `{ missions: MissionRecord[] }`
- [ ] `POST /api/missions` with `{ action: "create", title }` creates a record
- [ ] `POST /api/missions` with `{ action: "delete", id }` removes a record
- [ ] `MissionsList` displays API missions; shows empty state on zero results
- [ ] Graceful degradation: if fetch fails, shows an error notice (not a crash)
- [ ] `npm run lint && npm run typecheck` pass

## File budget
≤ 4 files changed / created

## Rollback
Delete `app/api/missions/route.ts` and `lib/runtime/missionStore.ts`;
revert `MissionsList.tsx` to static demo data.
