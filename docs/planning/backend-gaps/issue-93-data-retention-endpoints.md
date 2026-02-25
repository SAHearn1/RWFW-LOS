# Issue #93 — GAP-27: Data retention admin API endpoints

**Branch:** `claude/data-retention-RHg64`
**Label:** backend, gap, admin, medium
**Closes:** GAP-27

## Context

Four data lifecycle functions exist and are fully implemented but nothing calls them:

| Function | File |
|----------|------|
| `purgeLedgerRecordsBefore(cutoffIso)` | `lib/ledger/adapter.ts:55` |
| `deleteLedgerRecordsByLearner(learnerId)` | `lib/ledger/adapter.ts:62` |
| `purgeRuntimeStateBefore(cutoffIso)` | `lib/runtime/engine/store.ts:40` |
| `deleteRuntimeStateByLearner(learnerId)` | `lib/runtime/engine/store.ts:52` |

No API endpoints, no UI triggers. GDPR erasure and time-based retention are fully
coded but completely unreachable in production.

## Acceptance Criteria

### Route 1: `DELETE /api/admin/data-retention/learner`

File: `app/api/admin/data-retention/learner/route.ts`

- Auth guard: `admin` role only (via `parseAppRole` from `@/lib/auth/userRole` +
  `currentUser` from `@clerk/nextjs/server`). Return 403 if not admin.
- Body: `{ learnerId: string }`
- Calls both:
  - `deleteLedgerRecordsByLearner(learnerId)` from `@/lib/ledger/adapter`
  - `deleteRuntimeStateByLearner(learnerId)` from `@/lib/runtime/engine/store`
- Returns: `{ learnerId, ledgerDeleted: number, runtimeCleared: boolean, traceId }`
- Emits `recordAuditEvent` with `eventType: "admin.data.learner_deleted"`, `severity: "warning"`

### Route 2: `DELETE /api/admin/data-retention/purge`

File: `app/api/admin/data-retention/purge/route.ts`

- Auth guard: `admin` role only.
- Body: `{ cutoffIso: string }` — must be a valid ISO 8601 date string. Return 400 if invalid.
- Calls both:
  - `purgeLedgerRecordsBefore(cutoffIso)` from `@/lib/ledger/adapter`
  - `purgeRuntimeStateBefore(cutoffIso)` from `@/lib/runtime/engine/store`
- Returns: `{ cutoffIso, ledgerPurged: number, traceId }`
- Emits `recordAuditEvent` with `eventType: "admin.data.purge_executed"`, `severity: "warning"`

### ISO validation helper

Simple inline check — do NOT import a date library:
```typescript
function isValidIso(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}
```

## Guardrails

- **Touch only:** `app/api/admin/data-retention/learner/route.ts` (new),
  `app/api/admin/data-retention/purge/route.ts` (new)
- **Do NOT touch:** any file in `lib/ledger/`, `lib/runtime/`, `components/`, or
  `app/app/` — all functions are already implemented and exported
- **Do NOT touch:** `app/app/layout.tsx` (hard guardrail)
- Max 2 new files

## Key Imports

```typescript
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { parseAppRole } from "@/lib/auth/userRole";
import { deleteLedgerRecordsByLearner, purgeLedgerRecordsBefore } from "@/lib/ledger/adapter";
import { deleteRuntimeStateByLearner, purgeRuntimeStateBefore } from "@/lib/runtime/engine/store";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
```

## Definition of Done

- `npm run lint` exits 0
- `npm run typecheck` exits 0
- Both routes return 403 for non-admin role
- `DELETE /api/admin/data-retention/purge` with invalid ISO returns 400
- Commit and push to `claude/data-retention-RHg64`
