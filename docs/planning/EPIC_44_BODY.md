# EPIC: Phase 4 Hybrid Operational Engine (AWS + Local Ollama + Agent Federation)

## Goal
Deliver the operational engine end-to-end with deterministic contracts, hybrid cloud/local execution, and strict guardrails.

## Checklist
- [ ] #45 P4-01 contracts and state machine
- [ ] #46 P4-02 AWS baseline IaC placeholders
- [ ] #47 P4-03 queue adapter semantics
- [ ] #48 P4-04 worker runner lifecycle
- [ ] #49 P4-05 model provider contracts
- [ ] #50 P4-06 local Ollama adapter
- [ ] #51 P4-07 cloud provider adapter
- [ ] #52 P4-08 model routing policy
- [ ] #53 P4-09 federation registry schema
- [ ] #54 P4-10 federation protocol v1
- [ ] #55 P4-11 federation gateway API
- [ ] #56 P4-12 audit logging contract
- [ ] #57 P4-13 trace correlation IDs
- [ ] #58 P4-14 observability baseline
- [ ] #59 P4-15 engine smoke + CI gate
- [ ] #60 P4-16 env parity validator
- [ ] #61 P5-17 env example/auth verifier hardening
- [ ] #62 P5-18 threat model + security checks
- [ ] #63 P5-19 Clerk webhook verification
- [ ] #64 P5-20 DB ledger adapter
- [ ] #65 P5-21 standards plugin contracts
- [ ] #66 P5-22 retention/deletion hooks
- [ ] #67 P5-23 backup/restore runbook
- [ ] #68 P5-24 privacy boundary tests
- [ ] #69 P6-25 SLO and alert policy
- [ ] #70 P6-26 release gate aggregator
- [ ] #71 P6-27 branch protection preflight
- [ ] #72 P6-28 swarm conflict detector
- [ ] #73 P6-29 performance budget smoke
- [ ] #74 P6-30 governance review template

## Guardrails
- One PR per issue, <=15 files unless approved.
- No parallel PRs may edit the same layout file.
- Contract-first implementation for core interfaces.
- Required verification commands must pass on every PR.