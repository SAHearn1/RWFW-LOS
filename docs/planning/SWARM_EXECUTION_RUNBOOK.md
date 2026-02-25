# Swarm Runbook: Phase 4-6 Execution

Last Updated: 2026-02-25

## Day 1
- Create/confirm labels and open all EPIC + atomic issues.
- Launch parallel planning lanes only (no overlapping files):
  - Lane D: #45, #49, #53 (contracts only)
  - Lane E: #60, #70 (docs/verification skeleton)
  - Lane A: #61 (env blocker fix issue prep)
- Merge order: contracts first -> validators -> implementation tickets unblocked.

## Day 2
- Start engine implementation in parallel:
  - Lane D: #46, #47, #54
  - Lane C: #64, #65
  - Lane E: #59
- Required gate after each merge: lint, typecheck, build, verify:env, verify:role-routes.

## Day 3
- Start integration and safety controls:
  - Lane D: #48, #50, #51, #52, #55
  - Lane A: #56, #57, #63
  - Lane E: #71, #72
- Merge order: provider contracts -> adapters -> router -> federation API.

## Day 4
- Reliability/security hardening:
  - Lane A: #62, #66, #68
  - Lane E: #67, #69
  - Lane E/C: #73

## Day 5
- Release consolidation:
  - Lane E: #74 + final release evidence packet.
  - Run full command matrix and role E2E.
  - Publish go/no-go in `docs/status/PROGRAM_STATUS.md`.

## Cross-Lane Safety Rules
1. No parallel PRs may edit the same layout file.
2. If shared constants are required, land a tiny shared-contract PR first.
3. Keep each PR <= 15 files unless explicit approval is documented.
4. Every issue must include rollback steps and disabled-flag behavior.
5. Feature flags must default safe and never crash onboarding.

## Deterministic Verification Matrix (Every PR)
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run verify:env`
- `npm run verify:role-routes`
- `npm run verify:runtime-routes`
- `npm run verify:onboarding`
- `npm run verify:http-smoke`

## Release Verification (Phase Gate)
- `npm run verify:role-e2e`
- Vercel production deployment status must be `Ready` for latest deploy.
- Docs updated: runbooks, env keys, issue cross-links.