# Phase 4-6 Planning Backlog (Complete Picture)

Last Updated: 2026-02-25

## EPIC
- [ ] EPIC: Phase 4 Hybrid Operational Engine (AWS + Local Ollama + Agent Federation)

## Phase 4 Atomic Tickets (Operational Engine)
1. [ ] Define orchestration contracts and deterministic state machine
2. [ ] Provision AWS baseline IaC (queue, worker role, state store placeholders)
3. [ ] Implement execution queue adapter with retry/idempotency semantics
4. [ ] Implement worker runner skeleton with deterministic lifecycle hooks
5. [ ] Define model provider interface and routing contract
6. [ ] Build local Ollama provider adapter behind feature flag
7. [ ] Build cloud provider adapter for managed inference path
8. [ ] Implement model routing policy (privacy-first local fallback)
9. [ ] Define federation agent registry schema + capability contracts
10. [ ] Implement federation task protocol v1 (request/response/error envelope)
11. [ ] Implement federation gateway API endpoints (`/api/federation/*`)
12. [ ] Add role-scoped audit logging contract + storage adapter
13. [ ] Add trace correlation IDs through middleware and APIs
14. [ ] Add observability baseline (structured logs + health probes)
15. [ ] Add engine smoke verifier script + CI gate wiring
16. [ ] Add cloud/local env parity validator and runbook updates

## Phase 5 Atomic Tickets (Reliability + Security + Data)
17. [ ] Fix `.env.example` auth key formatting and harden env verification
18. [ ] Add threat model doc + security acceptance checks
19. [ ] Add Clerk webhook signature verification path and test script
20. [ ] Add DB-backed ledger adapter behind feature flag
21. [ ] Add standards verifier plugin architecture contract
22. [ ] Add data retention + deletion policy enforcement hooks
23. [ ] Add backup/restore runbook for hybrid state
24. [ ] Add privacy boundary route tests across all roles

## Phase 6 Atomic Tickets (Scale + Governance)
25. [ ] Add deployment SLOs and alert policy docs with machine-checkable thresholds
26. [ ] Add release gate aggregation script producing pass/fail summary artifact
27. [ ] Add branch protection verification checklist in docs + CI preflight
28. [ ] Add swarm conflict detector script for file-overlap prevention
29. [ ] Add performance budget smoke checks for `/` and `/app`
30. [ ] Add governance dashboard issue template for weekly release review

## Ownership Lanes (No-Overlap)
- Lane A (Auth/Security): `lib/auth/*`, `middleware.ts`, `app/sign-*`, `docs/security/*`
- Lane B (Shell/Nav/Onboarding): `components/app-shell/*`, `lib/nav/*`, `lib/onboarding/*`, `app/app/layout.tsx`
- Lane C (Runtime/Ledger/Standards): `lib/runtime/*`, `lib/ledger/*`, `lib/standards/*`, `components/studio/*`
- Lane D (Cloud/Federation): `lib/orchestration/*`, `lib/federation/*`, `app/api/federation/*`, `infra/*`
- Lane E (CI/Release/Docs): `.github/*`, `scripts/*`, `docs/*`, `README.md`

## Non-Negotiable Parallel Rule
No parallel PRs may edit the same layout file.