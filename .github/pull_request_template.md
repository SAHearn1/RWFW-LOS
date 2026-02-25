## Summary
- 

## Scope
### In Scope
- [ ]
### Out of Scope
- [ ]

## Dependencies
- [ ] None
- [ ] #<issue>

## Acceptance Criteria
1. 
2. 

## Test Routes
- [ ] `/`
- [ ] `/app`
- [ ] Additional routes tested:

## Verification
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run verify:env`
- [ ] `npm run verify:role-routes`
- [ ] `npm run verify:runtime-routes`
- [ ] `npm run verify:onboarding`
- [ ] `npm run verify:http-smoke`

## Manual Role Evidence
- [ ] Student role route captures attached (`/app`, `/app/studio`, `/app/credentials`)
- [ ] Teacher role route captures attached (`/app`, `/app/command-center`, `/app/cohorts`)
- [ ] Admin role route captures attached (`/app`, `/app/evidence`, `/app/exports`)

## UI Evidence
- [ ] No UI changes
- [ ] UI changed, screenshots/GIF attached for desktop and mobile

## Browser Quality Quick Pass (when UI changed)
- [ ] Lighthouse run captured (desktop + mobile)
- [ ] Console clean on key routes (no uncaught errors)
- [ ] Quick accessibility check captured (keyboard nav + headings)

## Env Changes
- [ ] No env var changes
- [ ] Updated `.env.example`

## Guardrails Check
- [ ] <= 15 files changed (or approved exception)
- [ ] No unrelated refactor
- [ ] Feature flags respected / disabled features safe
- [ ] No parallel PR overlap on the same layout file