## EPIC: Production Readiness Stabilization (#119)

### Objective
Resolve critical production risks and harden cloud runtime so Phase 1 shell can operate safely under real traffic.

### Child Tickets
- [ ] #120 [#PR-201] Serverless-safe ledger persistence on Vercel
- [ ] #121 [#PR-202] Durable audit transport for serverless runtime
- [ ] #122 [#PR-203] Clerk webhook event application for role/org propagation
- [ ] #123 [#PR-204] Enforce learner-level authorization in ledger API
- [ ] #124 [#PR-205] Federation POST must dispatch, not acknowledge-only
- [ ] #125 [#PR-206] Restore SQS+Dynamo as primary worker backend in production
- [ ] #126 [#PR-207] Durable AWS credential strategy for Vercel runtime
- [ ] #127 [#PR-208] Enforce cloud smoke in release gate and PR checklist
- [ ] #128 [#PR-209] Teacher surfaces: Command Center, Cohorts, Reviews
- [ ] #129 [#PR-210] Facilitator utilities: Builder and Pickups screens
- [ ] #130 [#PR-211] Admin surfaces: Standards and Exports baseline functionality
- [ ] #131 [#PR-212] QA and documentation closure for Phase 9

### Lane Boundaries
- Lane A (Auth/Security): #122, #123
- Lane B (Data/Observability): #120, #121
- Lane C (Cloud/Federation): #124, #125, #126
- Lane D (CI/Release): #127, #131
- Lane E (UX backlog, post-P1): #128, #129, #130

### Execution Order
1. P1: #120-#125
2. P1.5: #126-#127
3. P2: #128-#131

### Global Guardrails
- PR max ~15 files.
- No parallel PR edits to same layout or route handler.
- No framework changes.
- Must pass: `npm run lint` and `npm run build`.
- Must include route verification and rollback plan.
