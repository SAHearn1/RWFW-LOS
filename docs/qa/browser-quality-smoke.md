# Browser Quality Smoke Protocol

Run this protocol for UI-affecting PRs before merge.

## Scope
Target routes:
- `/`
- `/sign-in`
- `/app`
- `/app/studio`
- `/app/credentials`
- `/app/evidence`
- `/app/settings`
- `/app/exports`

## Protocol
1. Run build and live smoke:
- `npm run build`
- `npm run verify:http-smoke`

2. Run Lighthouse quick pass (Chrome DevTools):
- Desktop profile on `/` and `/app`
- Mobile profile on `/` and `/app`
- Record Performance, Accessibility, Best Practices, SEO scores

3. Check console quality:
- No uncaught errors on target routes
- No auth middleware runtime exceptions

4. Quick accessibility pass:
- Keyboard-only nav can reach main actions
- Headings are present and ordered logically
- Interactive controls have discernible labels

## Evidence Required in PR
- Lighthouse screenshots or score summary table
- Console clean screenshots (or note expected warnings)
- Before/after screenshots for changed UI

## Pass/Fail Rule
- Any repeatable runtime console error is a fail.
- Any target route returning 5xx is a fail.
- Missing evidence in UI PRs blocks merge.