# Phase 4 Release Gate

## Required Green Checks
- `npm run verify:release-gate`

## Included Automated Checks
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run verify:env`
- `npm run verify:env-parity`
- `npm run verify:role-routes`
- `npm run verify:runtime-routes`
- `npm run verify:onboarding`
- `npm run verify:http-smoke`

## Route Validation
- `/app`
- `/app/studio`
- `/app/credentials`
- `/app/evidence`
- `/app/settings`
- `/app/exports`

## Role Validation
- Students can access learner routes; denied for teacher/admin routes.
- Teacher can access teacher routes; denied for student/admin-only routes.
- Admin can access admin routes; denied for student/teacher-only routes.

## Auth Edge Cases
- Missing session redirects to `/sign-in`.
- Missing role displays friendly in-app block.
- Teacher/admin without org displays explicit organization assignment block.
- Malformed Clerk publishable key does not cause global 500; protected routes fail safely.

## Required Manual Evidence
- Role captures: see `docs/qa/manual-role-e2e-checklist.md`
- Browser quality pass: see `docs/qa/browser-quality-smoke.md`
- Release report artifact: `docs/status/release-gate-latest.json`

## Final Signoff
- CI green on `main`
- Role matrix unchanged or intentionally updated with docs + verifier sync
- Rollback path documented in `docs/operations-runbook.md`
