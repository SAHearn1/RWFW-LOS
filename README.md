# RootWork LOS

This repo now runs a Next.js App Router front-door shell with active Phase 2 and Phase 3 migration layers.

## Local Setup
1. Install dependencies:
   `npm install`
2. Copy env baseline:
   `cp .env.example .env.local`
3. Add Clerk keys and desired feature flags in `.env.local`
4. Run dev server:
   `npm run dev`

## Verification Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run verify:runtime-routes`

## Routes to Verify
- `/` public landing page
- `/sign-in` auth entry
- `/sign-up` auth entry
- `/app` PLE route (role-protected)
- `/app/studio` Studio route (role-protected)
- `/app/credentials` learner evidence summary
- `/app/evidence` admin evidence read view
- `/app/core` temporary core mount route (flag-gated)
- `/app/profile` role + org profile

## Required Feature Flags
- `NEXT_PUBLIC_ENABLE_LEDGER`
- `NEXT_PUBLIC_ENABLE_MCP`
- `NEXT_PUBLIC_ENABLE_PICKUP`
- `NEXT_PUBLIC_ENABLE_OFFLINE`
- `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT`
- `NEXT_PUBLIC_ENABLE_RUNTIME`
- `NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER`

## Auth and RBAC
- Roles:
  - `student_independent`
  - `student_enrolled`
  - `teacher`
  - `admin`
- `/app/*` routes require authentication.
- Wrong-role route access renders friendly in-app 403 content.
- Navigation is filtered by role.

## Onboarding
- Role-based onboarding tour runs for first app session.
- Tour restart is available from Help -> `Restart tour`.
- Disabled features are skipped safely when flags are off.

## Phase 2 and 3 Cutover
- Phase 2 runbook: `docs/phase2-cutover.md`
- Phase 3 runbook: `docs/phase3-cutover.md`

## Pre-commit Secret Scanning
`git-secrets` hooks are installed locally for this repository.

To scan manually:
`$env:USERPROFILE\\.git-secrets\\git-secrets.cmd --scan`
