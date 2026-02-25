# Phase 8 Planning Backlog (Pilot Operations + Productization)

Last Updated: 2026-02-25

## EPIC
- [x] #78 EPIC: Phase 8 Pilot Operations, Reliability, and Adoption Layer

## Atomic Tickets
1. [x] #79 Define pilot KPI contracts + metric event schema
2. [x] #80 Implement telemetry event ingestion adapter (privacy-safe)
3. [x] #81 Add admin pilot-health dashboard cards
4. [x] #82 Add teacher intervention queue with urgency scoring
5. [x] #83 Add learner progress timeline API + surface
6. [x] #84 Add in-app role-scoped notification center (no external channels)
7. [x] #86 Add support diagnostics bundle export at `/app/settings`
8. [x] #87 Add synthetic smoke monitor for critical routes
9. [x] #88 Add runtime-ledger consistency verifier and report
10. [x] #89 Add incident annotation workflow for failed deploys
11. [x] #90 Add pilot go/no-go checklist and signoff template
12. [x] #91 Add release drill script for rollback rehearsal

## Ownership Lanes (No-Overlap)
- Lane A (Auth/Security): `lib/auth/*`, `middleware.ts`, `app/sign-*`, `app/app/settings/*`
- Lane B (Shell/Nav/Onboarding): `components/app-shell/*`, `lib/nav/*`, `app/app/layout.tsx`
- Lane C (Runtime/Ledger/Standards): `lib/runtime/*`, `lib/ledger/*`, `lib/standards/*`
- Lane D (Cloud/Federation/Observability): `lib/orchestration/*`, `lib/federation/*`, `lib/observability/*`, `app/api/*`
- Lane E (CI/Release/Docs): `.github/*`, `scripts/*`, `docs/*`

## Non-Negotiable Parallel Rule
No parallel PRs may edit the same layout file.
