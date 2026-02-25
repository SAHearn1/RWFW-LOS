# Production Readiness Gap Analysis

Date: 2026-02-25
Owner: Release Captain
Status: Active remediation
Estimated readiness: ~45%

## Critical Production Risks (P1)
1. DB ledger path on Vercel serverless
- Finding: SQLite write path can hit read-only filesystem and fail with EACCES.
- Risk: Evidence writes fail silently or partially.
- Required fix: Route production ledger writes to network-persistent backend; no local disk dependency in serverless.

2. Audit logging transport on serverless
- Finding: file-based append is not durable in serverless runtime.
- Risk: No reliable audit trail in production.
- Required fix: structured stdout + durable sink integration path; remove file-write dependency for prod.

3. Clerk webhook processing gap
- Finding: signature can verify while business payload is not applied to role/org state.
- Risk: Role changes do not propagate to access controls.
- Required fix: process user.created/user.updated and persist role/org deltas deterministically.

4. Federation acceptance without dispatch
- Finding: endpoint can acknowledge requests without completing dispatch path.
- Risk: accepted tasks not executed.
- Required fix: enforce dispatch path with explicit routing result and failure response semantics.

5. Ledger API authorization gap
- Finding: learner-scoped record access checks are incomplete.
- Risk: cross-learner data exposure.
- Required fix: learnerId authorization enforced for all reads/writes; explicit teacher/admin policy checks.

## Additional Runtime Reliability Gaps (P1.5)
6. AWS worker backend can degrade to in-memory fallback in production.
- Required fix: root-cause and restore SQS+Dynamo primary backend on production smoke.

7. AWS credentials strategy is session-token based.
- Required fix: durable credential model or automated rotation runbook.

8. Cloud smoke verification not yet mandatory in release gate policy.
- Required fix: enforce `verify:cloud-aws-smoke` for cloud-enabled releases.

## Remediation Budget
- P1 estimated: ~12 engineering hours.
- P1.5 estimated: ~6 engineering hours.
- P2 product-surface completion tracked separately.

## Linked Execution Artifacts
- docs/status/SWARM_CONTROL_BOARD.md
- docs/planning/PHASE9_SWARM_EXECUTION_RUNBOOK.md
