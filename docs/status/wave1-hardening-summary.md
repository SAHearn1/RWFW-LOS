# Wave 1 Hardening Campaign — Summary

**Date:** 2026-02-27
**Status:** Complete

## Verify Suite Rewrites (6 PRs merged to main)

- PR #142 [VER-01]: verify-runtime-ledger-consistency — absent DB now exits 1; LEDGER_CONSISTENCY_ALLOW_SKIP flag; in-memory round-trip test
- PR #143 [VER-02]: verify-engine-smoke — functional wiring checks: provider instantiation, queue adapter, state store, federation route, stub detection
- PR #144 [VER-04]: verify-webhook-contract — real HMAC tests, role extraction checks, audit event verification
- PR #145 [VER-03]: verify-cloud-aws-smoke — stub string detection, usedFallback check, minimum output length, dry-run mode
- PR #146 [VER-05]: verify-release-gate — consistency check added, skipped-as-failure logic, non-blocking cloud smoke, full check inventory in report
- PR #147 [INF-01]: CloudManagedProvider — Bedrock InvokeModel replaces fire-and-forget EventBridge stub; multi-model support; non-blocking observability event

## Feature Surface Completeness (3 PRs merged to main)

- PR #148 [#128]: Teacher surfaces — CommandCenter live stats, CohortList ledger-derived, ReviewQueue ledger-read with wired Approve/Return/Flag
- PR #149 [#129/#130]: Facilitator+Admin — Builder/Pickups persist to ledger; Standards uses Manager (CRUD) for admin; Exports adds JSON+CSV download

## Issues Closed

- #127, #128, #129, #130, #131 (this PR), #135, #136, #137, #138, #139, #140, #141

## Remaining Known Gaps

- Cloud inference requires real AWS Bedrock credentials + BEDROCK_MODEL_ID env var in production
- Cohorts/Reviews show empty state until learners create missions in Studio
- Mission lifecycle UI (student flow) remains Phase 2 scope
- Onboarding tour engine not yet wired (tour contract + selectors exist; Shepherd.js integration deferred)
- LEDGER_CONSISTENCY_ALLOW_SKIP=true must be set in Vercel env vars when SQLite DB ledger not deployed
