# Swarm Control Board

Last Updated: 2026-02-25
Mode: Planning complete, execution queue initialized

## Active Milestone
- EPIC: #44

## Lane Assignments
- Lane A (Auth/Security): #61, #62, #63, #66, #68
- Lane B (Shell/Nav/Onboarding): reserved for cross-cutting follow-ons; blocked from layout collisions
- Lane C (Runtime/Ledger/Standards): #64, #65
- Lane D (Cloud/Federation): #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55
- Lane E (CI/Docs/Release): #59, #60, #67, #69, #70, #71, #72, #73, #74

## Day 1 Queue (parallel-safe)
1. #45 contracts/state machine
2. #49 model provider contracts
3. #53 federation registry contracts
4. #60 env parity validator plan
5. #70 release gate aggregator design
6. #61 `.env.example` blocker fix

## Merge Order
1. Contracts first: #45, #49, #53
2. Safety validator: #61, #60
3. CI aggregation foundation: #70
4. Engine infra adapters: #46, #47, #54

## Collision Prevention
- No parallel PR may modify `app/app/layout.tsx`.
- No parallel PR may modify `app/layout.tsx`.
- Shared constants must land in a tiny pre-PR when needed.

## Required PR Evidence
- Commands: lint + typecheck + build + verification matrix.
- Routes verified for touched behavior.
- Screenshots for UI changes.
- `.env.example` updated if env keys change.