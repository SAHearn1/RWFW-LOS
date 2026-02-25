# Role-Based Manual E2E Checklist

Use this checklist for release candidates and any PR that changes auth, nav, onboarding, or role protection.

## Preconditions
- Local env is valid: `npm run verify:env`
- App is running: `npm run dev`
- Test users available for each role:
  - `student_independent`
  - `student_enrolled`
  - `teacher`
  - `admin`

## Required Captures
Attach screenshots (desktop + mobile where UI changed) for these routes:
- Student:
  - `/app`
  - `/app/studio`
  - `/app/credentials`
- Teacher:
  - `/app`
  - `/app/command-center`
  - `/app/cohorts`
- Admin:
  - `/app`
  - `/app/evidence`
  - `/app/exports`

## Access-Control Assertions
- Unauthenticated access to `/app/*` redirects to `/sign-in`.
- Wrong-role access shows friendly 403 in-app experience.
- Correct-role access loads expected screen without crash.

## First 60 Seconds Assertions
- User can sign in.
- User lands in shell.
- User can reach PLE/Studio path for learner flow.
- User can start a mission placeholder and produce minimal artifact.

## Required Local Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run verify:env`
- `npm run verify:role-routes`
- `npm run verify:runtime-routes`
- `npm run verify:onboarding`
- `npm run verify:http-smoke`

## Failure Handling
- If auth fails: validate Clerk keys, remove quotes/whitespace, rerun `npm run verify:env`.
- If routing fails: verify `lib/auth/routeAccess.ts` and `lib/nav/items.ts` contracts.
- If onboarding fails: ensure disabled flags are skipped and selectors exist.