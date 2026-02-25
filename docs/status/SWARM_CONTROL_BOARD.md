# Swarm Control Board

Last Updated: 2026-02-25
Mode: Phase 8 planning complete, execution queue initialized

## Active Milestone
- EPIC: #78 (`OPEN`)

## Lane Assignments
- Lane A (Auth/Security): reserved for role/privacy hooks (no active ticket at kickoff)
- Lane B (Shell/Nav/Onboarding): #81, #82, #84
- Lane C (Runtime/Ledger/Standards): #83, #88
- Lane D (Cloud/Federation/Observability): #79, #80
- Lane E (CI/Docs/Release): #86, #87, #89, #90, #91

## Day 1 Queue (parallel-safe)
1. #79 KPI contracts and metric schema
2. #87 synthetic smoke monitor skeleton
3. #88 runtime-ledger consistency verifier contract
4. #90 pilot go/no-go checklist draft

## Merge Order
1. Contracts first: #79
2. Ingestion/monitor primitives: #80, #87, #88
3. Product surfaces: #81, #82, #83, #84
4. Support/release docs and drills: #86, #89, #90, #91

## Collision Prevention
- No parallel PR may modify `app/app/layout.tsx`.
- No parallel PR may modify `app/layout.tsx`.
- Shared constants must land in a tiny pre-PR when needed.
- No parallel PRs may run competing build jobs against the same checkout.

## Required PR Evidence
- Commands: lint + typecheck + build + verification matrix.
- Routes verified for touched behavior.
- Screenshots for UI changes.
- `.env.example` updated if env keys change.
