# [#90] FEATURE: Clerk webhook — sync role changes on user.updated (GAP-25)

## Problem
`app/api/webhooks/clerk/route.ts` correctly validates the HMAC signature but
discards the event payload entirely, returning `{ ok: true }` for all events.
When a SuperAdmin assigns the Teacher role in Clerk's dashboard (or via the
Teacher Assignment screen), the change is never propagated server-side.

This is a critical gap for trial: if the platform owner sets up a teacher
account, the session may not reflect the updated role until the user signs out
and back in, and server-side role caches (future) will never update.

## Scope
Lane A — Auth/Security

## Expected behaviour
- Parse the verified webhook body as a Svix event.
- Handle `user.updated`: extract `data.public_metadata.role`; write to a
  lightweight `lib/auth/roleSync.ts` in-memory registry (Map keyed by userId).
- Handle `user.created`: same — seed the registry with the initial role.
- `getCurrentAppRole()` in `lib/auth/currentRole.ts` is **not** modified —
  it continues to read from Clerk session. The registry is additive and
  available for future server-side lookups without a live Clerk API call.
- Return `{ ok: true, processed: eventType }` on success.
- Return `{ ok: true, skipped: true }` for unhandled event types.

## Files to create / modify
| File | Action |
|------|--------|
| `lib/auth/roleSync.ts` | NEW — in-memory role registry Map + read/write helpers |
| `app/api/webhooks/clerk/route.ts` | MODIFY — parse event, call roleSync on user.created / user.updated |

## Acceptance criteria
- [ ] `user.updated` event sets the role in `roleSync` registry
- [ ] `user.created` event seeds the registry
- [ ] Unknown event types return `{ skipped: true }` without error
- [ ] HMAC verification logic is unchanged
- [ ] `npm run verify:webhook-contract` passes
- [ ] `npm run lint && npm run typecheck` pass

## File budget
≤ 3 files changed / created

## Rollback
Delete `lib/auth/roleSync.ts`; revert `route.ts` to previous discard behaviour.
