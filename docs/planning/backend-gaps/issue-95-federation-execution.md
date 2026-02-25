# Issue #95 — GAP-29: Federation task execution dispatch

**Branch:** `claude/federation-exec-RHg64`
**Label:** backend, gap, medium
**Closes:** GAP-29

## Context

`app/api/federation/route.ts` correctly resolves agent assignment via
`resolveFederationAssignment()` — capability matching against a real registry — but
after accepting the task, returns `{ accepted: true, assignedAgentId }` and stops.
No agent handler is ever invoked. Tasks are accepted but silently dropped.

`FederationTaskResult` type already exists in `lib/federation/types.ts`:
```typescript
type FederationTaskResult = {
  taskId: string; correlationId: string;
  status: "success" | "error";
  output?: Record<string, unknown>;
  errorCode?: string; errorMessage?: string;
}
```

## Acceptance Criteria

### New: `lib/federation/taskStore.ts`

Simple module-level `Map<string, FederationTaskResult>` with:
- `storeFederationResult(result: FederationTaskResult): void`
- `getFederationResult(taskId: string): FederationTaskResult | undefined`
- `listFederationResults(): FederationTaskResult[]`

No persistence — in-memory only for now. Server restarts clear the store.

### New: `lib/federation/taskDispatch.ts`

`dispatchFederationTask(task: FederationTaskEnvelope, assignedAgentId: string): FederationTaskResult`

Dispatches synchronously by `task.capabilityId`:
- `"standards.verify"`: calls `verifyArtifactText(task.payload.artifactText as string)`
  from `@/lib/standards/verifier/localVerifier`. Returns results in `output.results`.
- `"runtime.execute"`: returns `{ status: "success", output: { message: "runtime.execute acknowledged" } }`
- `"federation.route"`: returns `{ status: "success", output: { message: "federation.route acknowledged" } }`
- Unknown `capabilityId`: returns `{ status: "error", errorCode: "capability_not_implemented", errorMessage: \`capabilityId ${task.capabilityId} has no handler\` }`

All results must include `taskId` and `correlationId` from the input envelope.

### Modify: `app/api/federation/route.ts`

**In the POST handler**, after `resolveFederationAssignment()` returns accepted:
1. Call `dispatchFederationTask(body.task, assignment.assignedAgentId)`
2. Call `storeFederationResult(result)`
3. Include `result.output` in the response alongside `accepted: true`

**Add GET handler** for result polling:
```
GET /api/federation?taskId=<id>
```
- If `taskId` query param present: look up via `getFederationResult(taskId)`.
  Return 200 + result, or 404 if not found.
- If no `taskId`: return existing discovery response (existing behavior preserved).

## Guardrails

- **Touch only:** `lib/federation/taskStore.ts` (new), `lib/federation/taskDispatch.ts` (new),
  `app/api/federation/route.ts`
- **Do NOT touch:** `lib/federation/types.ts`, `lib/federation/registry.ts`,
  `lib/federation/protocol.ts`, `lib/federation/registryContracts.ts`
- **Do NOT touch:** `app/app/layout.tsx` (hard guardrail)
- Max 3 files (2 new + 1 modified)

## Key Imports

```typescript
// taskDispatch.ts
import { verifyArtifactText } from "@/lib/standards/verifier/localVerifier";
import type { FederationTaskEnvelope, FederationTaskResult } from "./types";

// route.ts additions
import { dispatchFederationTask } from "@/lib/federation/taskDispatch";
import { storeFederationResult, getFederationResult } from "@/lib/federation/taskStore";
```

## Definition of Done

- `npm run lint` exits 0
- `npm run typecheck` exits 0
- `POST /api/federation` with `capabilityId: "standards.verify"` + `artifactText`
  returns result with `output.results` populated
- `GET /api/federation?taskId=<id>` returns the stored result
- Commit and push to `claude/federation-exec-RHg64`
