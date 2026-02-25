# Swarm Runbook: Phase 8 Execution

Last Updated: 2026-02-25

## Day 1
- Open EPIC + 12 atomic tickets with strict folder boundaries.
- Start contracts/docs first in parallel-safe lanes:
  - Lane D: contracts for KPI/telemetry
  - Lane E: synthetic monitor + go/no-go docs
  - Lane C: consistency verifier contract

## Day 2
- Implement product surfaces:
  - Admin pilot health cards
  - Teacher intervention queue
  - Learner timeline route/surface

## Day 3
- Reliability and supportability:
  - Notifications center
  - Diagnostics export
  - Incident annotation workflow

## Day 4
- Validation hardening:
  - Synthetic monitor rollout
  - Runtime-ledger consistency report
  - Rollback rehearsal script

## Day 5
- Consolidation:
  - Full release gate
  - Role route verification
  - Publish go/no-go status

## Cross-Lane Safety Rules
1. No parallel PRs may edit the same layout file.
2. Keep each PR <= 15 files unless explicitly approved.
3. Land shared contracts before dependent implementations.
4. Every issue must include rollback steps and disabled-flag behavior.
5. No new frameworks/libraries unless explicitly ticketed.

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
- `npm run verify:release-gate`
- `npm run verify:role-e2e`
- Latest Vercel deployment must be `Ready`
