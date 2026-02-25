## EPIC: Production Readiness Stabilization

### Objective
Resolve critical production risks and harden cloud runtime so Phase 1 shell can operate safely under real traffic.

### Scope
- P1 critical fixes (security, data integrity, dispatch correctness)
- P1.5 runtime reliability and release gate enforcement
- P2 screens remain separate and only start after P1 closure

### Out of Scope
- New feature frameworks
- Full facilitator/admin UX expansion inside P1

### Checklist
- [ ] DB ledger path is serverless-safe in production
- [ ] Audit events are durable in production path
- [ ] Clerk webhook events update role/org state
- [ ] Ledger API enforces learner-level authorization
- [ ] Federation POST performs real dispatch
- [ ] Production worker backend uses SQS+Dynamo as primary
- [ ] AWS credential strategy is durable
- [ ] Cloud smoke is mandatory in release gate

### Deterministic Definition of Done
- `npm run lint`
- `npm run build`
- `npm run verify:release-gate`
- `npm run verify:cloud-aws-smoke`
- Routes verified: `/api/ledger/records`, `/api/webhooks/clerk`, `/api/federation`, `/api/orchestration/worker-run`

### Guardrails
- Max ~15 files per PR
- No parallel PR may edit same layout or route handler file
- Shared contracts via tiny pre-PR if overlap is required
- No framework changes
