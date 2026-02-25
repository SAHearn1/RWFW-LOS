# Phase 3 Cutover Runbook

## Objective
Roll out runtime, ledger, and standards verification safely while preserving current shell stability.

## Required Flags
- `NEXT_PUBLIC_ENABLE_RUNTIME`
- `NEXT_PUBLIC_ENABLE_LEDGER`
- `NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER`

## Local Verification Commands
1. `npm install`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run verify:runtime-routes`

## Route Verification
- `/app`: mission lifecycle actions update runtime state.
- `/app/studio`: artifact save writes ledger and verification summary.
- `/app/credentials`: learner evidence summary loads.
- `/app/evidence`: admin evidence read view loads.

## Rollback Plan
1. Immediate containment
- set `NEXT_PUBLIC_ENABLE_RUNTIME=false`
- set `NEXT_PUBLIC_ENABLE_LEDGER=false`
- set `NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER=false`

2. Code rollback
- revert latest Phase 3 runtime/ledger/verifier commits
- redeploy preview and then production

3. Post-rollback checks
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- route checks for `/app`, `/app/studio`, `/app/credentials`, `/app/evidence`

## Guardrails
- No parallel PRs may edit the same layout file.
- Keep PRs <= 15 files unless approved.
- Contracts before implementation for core surfaces.
