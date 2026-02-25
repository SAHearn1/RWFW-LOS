# [#91] FIX: Audit log — use writable path, prevent silent serverless failure (GAP-24)

## Problem
`lib/observability/audit.ts` calls `appendFileSync` to write to
`docs/status/audit-log.ndjson` — a project-relative path that is read-only
on Vercel's serverless runtime. All audit writes fail silently in production.
The audit trail (federation events, webhook events) is never actually persisted.

## Scope
Lane A — Auth/Security

## Expected behaviour
- In all environments: write to `/tmp/rootwork-audit.ndjson` (writable in
  serverless; ephemeral per instance, but at least observable in logs).
- Additionally: emit each audit event to `console.log` as a structured JSON
  line so Vercel Log Drains / CloudWatch can capture it.
- The existing `docs/status/audit-log.ndjson` file is used only in development
  when `NODE_ENV === "development"` (retain the existing path for local dev).
- The `AuditEvent` type and function signature are unchanged.
- No crash if `/tmp` is also unavailable (try/catch, log the error to stderr).

## Files to modify
| File | Action |
|------|--------|
| `lib/observability/audit.ts` | MODIFY — conditional path logic + console emit |

## Acceptance criteria
- [ ] In production (non-development): writes to `/tmp/rootwork-audit.ndjson`
      AND emits to `console.log`
- [ ] In development: writes to `docs/status/audit-log.ndjson` as before
- [ ] No crash if write fails — error is caught and logged to stderr
- [ ] `npm run lint && npm run typecheck` pass

## File budget
≤ 1 file changed

## Rollback
`git revert` the single commit.
