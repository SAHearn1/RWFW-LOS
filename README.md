# RootWork LOS

This repo runs a Next.js App Router shell with active Phase 2-5 hardening work.

## Local Setup
1. Install dependencies:
   `npm install`
2. Copy env baseline:
   `cp .env.example .env.local`
3. Add Clerk keys and desired feature flags in `.env.local`
4. Run dev server:
   `npm run dev`

## Verification Commands
- `npm run verify:release-gate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run verify:env`
- `npm run verify:env-parity`
- `npm run verify:role-routes`
- `npm run verify:runtime-routes`
- `npm run verify:onboarding`
- `npm run verify:http-smoke`
- `npm run verify:role-e2e` (requires E2E role credentials)

## Key Routes
- `/app`
- `/app/studio`
- `/app/credentials`
- `/app/evidence`
- `/app/settings`
- `/app/exports`
- `/app/core`

## Runbooks
- `docs/phase2-cutover.md`
- `docs/phase3-cutover.md`
- `docs/operations-runbook.md`
- `docs/phase4-release-gate.md`

## QA
- `docs/qa/role-matrix.md`
- `docs/qa/manual-role-e2e-checklist.md`
- `docs/qa/browser-quality-smoke.md`
