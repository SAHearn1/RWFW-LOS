# Phase 2 Cutover Runbook

## Purpose
Safely migrate core LOS screens into Next.js `/app/*` routes with deterministic fallback and rollback.

## Preconditions
- Feature flags set in Vercel and `.env.local`.
- Clerk auth keys present for target environment.
- Branch is rebased onto latest `main`.

## Deploy Verification Commands
1. `npm install`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`

## Route Verification
- `/` public landing loads.
- `/app` renders PLE screen for student role.
- `/app/studio` renders Studio screen for student role.
- `/app/core` behavior:
  - flag OFF: disabled fallback message
  - flag ON: core mount runtime screen
- `/app/profile` shows role + org context.

## Rollback Controls
1. Immediate mitigation:
- set `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT=false`

2. Code rollback:
- revert latest core-mount migration commit(s)
- redeploy preview then production

3. Validation after rollback:
- rerun lint/typecheck/build
- reverify `/app`, `/app/studio`, `/app/core`

## Ownership Rules
- No parallel PRs may edit the same layout file.
- Shared contracts must land first in a tiny PR when conflicts are likely.
- Keep PR scope <= 15 files unless explicitly approved.
