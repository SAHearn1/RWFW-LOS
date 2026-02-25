# Service Level Objectives and Alert Policy

Last Updated: 2026-02-25

## SLO Targets
- Build gate success rate on `main`: >= 99%
- Production deployment success (latest deploy): 100% ready required for release signoff
- HTTP smoke route availability (`/`, `/app`): >= 99%
- Role E2E smoke pass rate (all defined roles): 100% on release candidates

## Alert Thresholds
- Critical: release gate failure on `main`
- High: two consecutive production deployment errors
- High: role E2E fails for any role
- Medium: HTTP smoke latency budget violations on `/` or `/app`

## Response Targets
- Critical: triage within 15 minutes
- High: triage within 30 minutes
- Medium: triage within 4 hours

## Evidence Required
- Release gate artifact (`docs/status/release-gate-latest.json`)
- Vercel deployment status snapshot
- Role E2E artifact bundle
