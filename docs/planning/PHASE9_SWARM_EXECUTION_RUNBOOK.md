# Phase 9 Swarm Execution Runbook (Production Readiness)

Last Updated: 2026-02-25

## Day 1 (P1 security/data)
- Lane A: webhook event processing, ledger learner authorization.
- Lane B: serverless-safe ledger persistence and audit transport.
- Merge order: authorization contracts -> webhook/ledger handlers -> persistence adapters.

## Day 2 (P1 cloud dispatch)
- Lane C: federation dispatch implementation + orchestration AWS primary path.
- Lane D: add cloud smoke to release gate and CI checklist.
- Merge order: federation dispatch -> worker backend primary -> release gate enforcement.

## Day 3 (P1.5 hardening)
- Lane C: durable AWS credential strategy docs/runbook and env policy.
- Lane D: release evidence publication and go/no-go verification.

## Day 4+ (P2 UX backlog)
- Lane E parallelizes facilitator/admin screens after P1/P1.5 closure.

## File Ownership Matrix
- Auth/Security: `app/api/webhooks/clerk/`, `app/api/ledger/`, `lib/auth/`
- Data/Observability: `lib/ledger/`, `lib/observability/`
- Cloud/Federation: `app/api/federation/`, `app/api/orchestration/`, `lib/orchestration/`, `lib/federation/`, `infra/aws/`
- CI/Release: `.github/`, `scripts/verify-*.mjs`, `package.json`
- UX backlog: `app/app/command-center/`, `app/app/cohorts/`, `app/app/reviews/`, `app/app/standards/`, `app/app/exports/`

## Non-Negotiable Guardrails
1. No PR edits outside lane ownership except approved shared-contract PR.
2. No framework changes.
3. No route renames outside issue scope.
4. No new analytics/runtime subsystems in P1 fixes.
5. Feature flags must fail safe and skip missing components without crashing.

## Deterministic Definition of Done (per ticket)
- Required commands: `npm run lint && npm run build`
- Required route verification: issue-specific list must pass.
- Rollback plan documented in issue.
- Evidence attached in issue comments.
