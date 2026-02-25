# Operations Runbook

## Incident Triage
1. Confirm failing surface:
- auth/session issue
- route protection issue
- runtime/ledger consistency issue
- onboarding selector issue

2. Run local verification bundle:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run verify:env`
- `npm run verify:role-routes`
- `npm run verify:runtime-routes`
- `npm run verify:onboarding`

3. Scope impact by role:
- student_independent
- student_enrolled
- teacher
- admin

## Rollback Decision Tree
- If auth fallback/regression: revert latest auth/layout commit and redeploy.
- If route contract mismatch: restore `lib/auth/routeAccess.ts` from last green commit.
- If runtime/ledger issue: disable `NEXT_PUBLIC_ENABLE_RUNTIME` and/or `NEXT_PUBLIC_ENABLE_LEDGER`.
- If verifier/onboarding issue: disable feature flag and revert offending selector updates.

## Recovery Steps
1. Apply containment flag changes.
2. Redeploy preview and validate role matrix routes.
3. Promote to production only after all verifiers pass.

## Ownership Rules
- No parallel PRs may edit same layout file.
- Shared contracts must merge before dependent changes.
- Keep PR file count <= 15 unless explicitly approved.
