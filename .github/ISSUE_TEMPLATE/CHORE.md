---
name: "Chore"
about: "Track non-feature, non-bug maintenance work with explicit safety boundaries"
title: "[CHORE] "
labels: ["type:chore", "risk:low", "agent:solo"]
assignees: []
---

## Summary
Describe the maintenance task.

## Objective
What operational or codebase health outcome is expected?

## Scope
### In Scope
- [ ]
- [ ]

### Out of Scope
- [ ] New product behavior
- [ ] Unapproved refactors

## Dependencies
- [ ] None
- [ ] #<issue>
- [ ] External requirement (tooling/platform):

## Acceptance Criteria (Testable)
1. Task output is complete and reviewable.
2. No user-facing regressions introduced.
3. `npm run lint` passes.
4. `npm run build` passes.

## Files Likely Touched
- `...`
- `...`

## Rollback Plan
- Revert strategy:
- Config rollback steps:
- Operational fallback:

## Guardrails (Must NOT Change)
- Do not modify auth roles/permissions.
- Do not change navigation IA unless explicitly in scope.
- Do not introduce new frameworks or heavy services.
- Keep changes within approved file-count budget unless approved.

## Risk and Agent Mode
- Risk: `risk:low` | `risk:med` | `risk:high`
- Execution: `agent:solo` | `agent:swarm`

## Verification Plan
Commands/checks reviewers should run:
- `npm run lint`
- `npm run build`
