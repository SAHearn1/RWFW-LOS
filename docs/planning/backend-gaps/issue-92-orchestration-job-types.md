# Issue #92 — GAP-23: Orchestration typed job dispatch

**Branch:** `claude/orchestration-jobs-RHg64`
**Label:** backend, gap, medium
**Closes:** GAP-23

## Context

`app/api/orchestration/worker-run/route.ts` already exists with a full queue/lease/execute
lifecycle (SQS → in-memory fallback, DynamoDB state store). The `execute` callback is a
no-op unless `simulateFailure: true` — no real job types are dispatched.

`lib/orchestration/workerRunner.ts` accepts `execute: (job) => Promise<void>` — the
dispatch hook is already there waiting for typed handlers.

## Acceptance Criteria

1. A new file `lib/orchestration/jobTypes.ts` defines a typed job payload union:
   - `StandardsVerifyJobPayload`: `{ jobType: "standards.verify"; artifactText: string; standards?: StandardDescriptor[] }`
   - `RuntimeSmokeJobPayload`: `{ jobType: "runtime.smoke" }` (keeps existing smoke behavior)
   - Export `OrchestrationJobPayload = StandardsVerifyJobPayload | RuntimeSmokeJobPayload`

2. `app/api/orchestration/worker-run/route.ts` is updated:
   - `execute` function switches on `job.payload.jobType`
   - `"standards.verify"`: calls `verifyArtifactText(payload.artifactText, payload.standards)`
     from `lib/standards/verifier/localVerifier.ts`; attaches result to lifecycle output
   - `"runtime.smoke"` or missing: existing no-op behavior
   - Unknown `jobType`: throws `"unsupported_job_type"` (fails job cleanly)

3. Response shape unchanged — `WorkerExecutionResult` still returned. `lifecycle` field
   gains an optional `output?: Record<string, unknown>` that carries verification results.

4. `npm run typecheck` passes. `npm run lint` passes.

5. Smoke test: `POST /api/orchestration/worker-run` with
   `{ "payload": { "jobType": "standards.verify", "artifactText": "I reflect on my goal" } }`
   returns `{ lifecycle: { status: "succeeded", output: { results: [...] } } }`.

## Guardrails

- **Touch only:** `lib/orchestration/jobTypes.ts` (new), `app/api/orchestration/worker-run/route.ts`
- **Do NOT touch:** `lib/orchestration/contracts.ts`, `stateMachine.ts`, `queueAdapter.ts`,
  `workerRunner.ts`, `dynamoStateStore.ts`, `sqsQueueAdapter.ts`, or any component file
- **Do NOT touch:** `app/app/layout.tsx` (hard guardrail)
- Max 2 files changed

## Key Imports Available

```typescript
// In worker-run/route.ts, add:
import { verifyArtifactText } from "@/lib/standards/verifier/localVerifier";
import type { OrchestrationJobPayload } from "@/lib/orchestration/jobTypes";
```

## Definition of Done

- `npm run lint` exits 0
- `npm run typecheck` exits 0
- Manual `curl` of the smoke test returns `lifecycle.status === "succeeded"`
- Commit and push to `claude/orchestration-jobs-RHg64`
