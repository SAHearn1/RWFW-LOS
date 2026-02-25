# Release Rollback Drill Runbook

Last Updated: 2026-02-25

## Purpose
Rehearse release rollback execution without performing destructive production actions.

## Default Mode (Dry Run)
- Command: `npm run verify:release-drill`
- Behavior:
  - Generates `docs/status/release-drill-latest.json`
  - Marks steps as `planned`
  - Executes no destructive actions

## Check-Run Mode
- Command: `npm run verify:release-drill -- --run-checks`
- Behavior:
  - Runs `npm run verify:release-gate`
  - Marks rehearsal steps pass/fail
  - Still executes no rollback or deployment mutation

## Drill Steps
1. Capture current release gate baseline.
2. Identify rollback target commit/deployment.
3. Rehearse feature-flag containment plan in non-production context.
4. Verify post-rollback health checks.

## Success Criteria
- Report generated in `docs/status/release-drill-latest.json`
- In check-run mode, all steps marked `passed`
- No destructive actions executed

## Guardrails
- Do not run destructive rollback commands from this script.
- Keep rehearsal evidence attached to incident/release tickets.
