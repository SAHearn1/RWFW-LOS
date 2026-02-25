# Swarm Control Board

Last Updated: 2026-02-25
Mode: Phase 9 production-readiness execution active

## Active Milestone
- EPIC: Production Readiness Stabilization (to be created)

## Lane Assignments (Hard Boundaries)
- Lane A (Auth/Security): webhook processing + ledger authorization only.
  - Ownership: app/api/webhooks/clerk/*, app/api/ledger/*, lib/auth/*
- Lane B (Data/Observability): ledger persistence path + audit durability only.
  - Ownership: lib/ledger/*, lib/observability/*, docs/runbooks/*
- Lane C (Cloud/Federation): federation dispatch + orchestration backend + AWS credential model.
  - Ownership: app/api/federation/*, app/api/orchestration/*, lib/orchestration/*, lib/federation/*, infra/aws/*
- Lane D (CI/Release): release gate policy and smoke integration only.
  - Ownership: package.json, scripts/verify-*.mjs, .github/*
- Lane E (UX backlog): facilitator/admin non-critical surface tickets only (post-P1).
  - Ownership: app/app/command-center/*, app/app/cohorts/*, app/app/reviews/*, app/app/standards/*, app/app/exports/*

## Collision Prevention (Mandatory)
- No parallel PR may modify `app/app/layout.tsx`.
- No parallel PR may modify `app/layout.tsx`.
- No parallel PR may modify the same route handler file.
- Shared contract edits require a tiny pre-PR first.
- PR size cap: <=15 files unless explicitly approved in issue.

## Required PR Evidence
- Commands: `npm run lint`, `npm run build`, plus issue-specific verify commands.
- Route checks listed in TEST PLAN section.
- Screenshot/GIF required for UI changes.
- `.env.example` updated for env changes.

## Quality Gate Policy
- Do not merge on failed lint/build.
- Do not merge if role protection or learner data isolation regresses.
- Do not merge if disabled feature flags crash onboarding/runtime paths.
