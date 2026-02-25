# Incident Annotation Workflow

Last Updated: 2026-02-25

## Trigger
Use this workflow when any deployment enters `Error` or a release gate fails in CI.

## Steps
1. Open a GitHub issue from `.github/ISSUE_TEMPLATE/INCIDENT_ANNOTATION.md`.
2. Capture deployment URL, environment, and UTC failure window.
3. Record impacted routes and roles with concrete symptoms.
4. Add deterministic reproduction commands and expected failure signal.
5. Document root cause and contributing factors.
6. Record mitigation and corrective action.
7. Attach verification evidence (`lint`, `typecheck`, `build`, `verify:release-gate`).
8. Link remediation PR(s) and mark incident closed only after latest deploy is `Ready`.

## Required Evidence Artifacts
- `docs/status/release-gate-latest.json`
- `vercel ls` output snippet with deployment status
- Any new or updated runbook references

## Closure Criteria
- Latest deployment state is `Ready`.
- Incident issue contains root cause + mitigation.
- Corrective actions are either merged or tracked in follow-up issues.
