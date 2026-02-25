# Incident Annotation

name: Incident Annotation
about: Document failed deploy incidents with reproducible evidence, root cause, and mitigation.
title: "[Incident] YYYY-MM-DD short-summary"
labels: ["area:docs", "type:chore", "risk:low", "agent:solo"]

## Scope
### In Scope
- Failed deploy annotation with timeline, impact, root cause, and corrective actions.
### Out of Scope
- Feature implementation unrelated to incident remediation.

## Dependencies
- Deployment logs and release-gate report artifacts.

## Incident Metadata
- Deployment URL:
- Environment: Preview | Production
- First failure timestamp (UTC):
- Last failure timestamp (UTC):
- Detection method:

## Impact
- Affected routes:
- Affected roles:
- User-visible symptoms:

## Deterministic Reproduction
1. Exact command(s):
2. Route(s) to verify:
3. Expected failure signal:

## Root Cause
- Primary root cause:
- Contributing factors:

## Mitigation + Verification
- Immediate mitigation applied:
- Long-term corrective action:
- Verification commands:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run verify:release-gate`

## Files Likely Touched
- `docs/status/*`
- `docs/operations-runbook.md`
- `.github/workflows/*` (if pipeline remediation needed)

## Rollback Plan
- Revert remediation commit(s) and restore last known good deployment.

## Guardrails
- No scope creep beyond incident remediation.
- No auth/role semantic changes unless incident directly requires it.
- Keep PR <= 15 files unless explicitly approved.
