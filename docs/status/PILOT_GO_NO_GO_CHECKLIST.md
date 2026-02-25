# Pilot Go/No-Go Checklist

Date:
Release Captain:
Approvers:

## Objective Gates (Must Pass)
1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm run verify:release-gate`
5. `npm run verify:synthetic-smoke` (with production base URL)
6. `npm run verify:runtime-ledger-consistency`

## Route Verification
- `/`
- `/sign-in`
- `/app`
- `/app/studio`
- `/app/settings`
- `/app/exports`

## Role Verification
- student roles can access learner routes and are blocked from teacher/admin-only routes.
- teacher role can access teacher routes and is blocked from admin-only routes.
- admin role can access admin routes and receives expected data surfaces.

## Environment and Flags
- `.env.example` updated for any new keys.
- No malformed public auth keys.
- Disabled flags do not crash onboarding or app shell.

## Deployment Health
- Latest Vercel deployment is `Ready`.
- No active production incident without documented mitigation.

## Signoff
- [ ] Engineering Lead
- [ ] Release Captain
- [ ] Product Owner

Decision:
- [ ] GO
- [ ] NO-GO

Notes:
