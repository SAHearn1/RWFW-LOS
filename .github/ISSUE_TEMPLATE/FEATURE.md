---
name: "Feature"
about: "Request a new capability with explicit scope, dependencies, and safe rollout"
title: "[FEATURE] "
labels: ["type:feature", "risk:med", "agent:solo"]
assignees: []
---

## Summary
Describe the feature in 2-4 sentences.

## Problem / Outcome
What user or business outcome does this solve?

## Scope
### In Scope
- [ ]
- [ ]

### Out of Scope
- [ ]
- [ ]

## Dependencies
List blocking or related items (issues, PRs, env vars, services, teams).
- [ ] None
- [ ] #<issue>

## Acceptance Criteria (Testable)
Use explicit, verifiable statements.
1. Given ..., when ..., then ...
2. Given ..., when ..., then ...
3. `npm run lint` passes
4. `npm run build` passes

## Files Likely Touched
List expected files/paths to reduce overlap across agents.
- `src/...`
- `src/...`

## Rollback Plan
How to safely disable/revert if this regresses.
- Feature flag(s):
- Revert strategy:
- Data impact:

## Guardrails (Must NOT Change)
Explicitly list non-goals and protected boundaries.
- Do not change auth provider or role semantics.
- Do not introduce new frameworks.
- Do not refactor unrelated modules.
- Do not exceed approved change budget without approval.

## Risk and Agent Mode
- Risk: `risk:low` | `risk:med` | `risk:high`
- Execution: `agent:solo` | `agent:swarm`

## Verification Plan
Routes, commands, and checks reviewers can run.
- Local commands:
  - `npm run lint`
  - `npm run build`
- Routes to verify:
  - `/`
  - `/app`
