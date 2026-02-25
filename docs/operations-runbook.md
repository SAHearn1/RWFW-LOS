# Operations Runbook

## Incident Triage
1. Confirm failing surface:
- auth/session issue
- route protection issue
- runtime/ledger consistency issue
- onboarding selector issue
- cloud/local parity issue
- federation or webhook signature issue

2. Run local verification bundle:
- `npm run verify:release-gate`
- or granular checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run verify:env`
  - `npm run verify:env-parity`
  - `npm run verify:engine-smoke`
  - `npm run verify:webhook-contract`
  - `npm run verify:branch-policy`
  - `npm run verify:swarm-overlap`
  - `npm run verify:role-routes`
  - `npm run verify:runtime-routes`
  - `npm run verify:onboarding`
  - `npm run verify:http-smoke`

3. Scope impact by role:
- student_independent
- student_enrolled
- adult_learner
- teacher
- professional_development
- admin

## Known Failure Mode: Malformed Clerk Publishable Key
- Symptom: global HTTP 500 on all routes during runtime.
- Root cause: auth middleware initializes Clerk with invalid publishable key.
- Mitigation in code:
  - `middleware.ts` bypasses Clerk and fails safe for protected routes when key is invalid.
  - sign-in/sign-up routes show controlled unavailable state instead of crashing.
- Regression prevention:
  - `npm run verify:env`
  - `npm run verify:http-smoke` in CI.

## Clerk Key Normalization Protocol
- Never wrap Clerk keys in single or double quotes in Vercel project env vars.
- Remove accidental whitespace/newlines when rotating keys.
- Re-sync local env after Vercel updates and re-run:
  - `npm run verify:env`
  - `npm run verify:http-smoke`

## Cloud + Local Parity Protocol
- Keep `.env.example` as the canonical contract for AWS + Ollama + federation keys.
- Validate parity with:
  - `npm run verify:env-parity`
- If local Ollama is enabled (`NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA=true`), both `OLLAMA_BASE_URL` and `OLLAMA_MODEL` must be present.
- If federation is enabled (`NEXT_PUBLIC_ENABLE_FEDERATION=true`), `FEDERATION_GATEWAY_SHARED_SECRET` must be set.
- Partial AWS config is treated as invalid; all orchestration keys must be set together.

## Rollback Decision Tree
- If auth fallback/regression: revert latest auth/layout commit and redeploy.
- If route contract mismatch: restore `lib/auth/routeAccess.ts` from last green commit.
- If runtime/ledger issue: disable `NEXT_PUBLIC_ENABLE_RUNTIME` and/or `NEXT_PUBLIC_ENABLE_LEDGER`.
- If verifier/onboarding issue: disable feature flag and revert offending selector updates.
- If cloud/local parity issue: disable `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA` and `NEXT_PUBLIC_ENABLE_FEDERATION` until keys are corrected.
- If webhook verification issue: disable webhook endpoint route and rotate `CLERK_WEBHOOK_SECRET`.

## Recovery Steps
1. Apply containment flag changes.
2. Redeploy preview and validate role matrix routes.
3. Promote to production only after all verifiers pass.

## Ownership Rules
- No parallel PRs may edit same layout file.
- Shared contracts must merge before dependent changes.
- Keep PR file count <= 15 unless explicitly approved.


## Backup and Restore Reference
- See docs/runbooks/hybrid-backup-restore.md for step-by-step hybrid backup/restore.


## Vercel Incident Timeline (2026-02-25)
- Window observed: approximately 10-12 hours before stabilization checks.
- Impact pattern: a cluster of production deploys reported `Error` status.
- Current state: latest production deploys returned to `Ready` status.
- Containment used: release-gate verification plus env/auth contract checks before redeploy.
- Prevention:
  - avoid parallel build jobs on the same worktree,
  - run `npm run verify:release-gate` before production promotion,
  - treat env key formatting drift as a release blocker.
