---
name: "Bug"
about: "Report a defect with reproducible steps and containment plan"
title: "[BUG] "
labels: ["type:bug", "risk:med", "agent:solo"]
assignees: []
---

## Summary
Describe the defect clearly and concisely.

## Impact
Who is affected and how severe is the user/system impact?

## Reproduction
1. 
2. 
3. 

## Expected vs Actual
- Expected:
- Actual:

## Scope
### In Scope
- [ ] Fix root cause
- [ ] Add regression coverage

### Out of Scope
- [ ] Unrelated refactors
- [ ] Visual redesign outside defect area

## Dependencies
Related issues/PRs/services/flags.
- [ ] None
- [ ] #<issue>

## Acceptance Criteria (Testable)
1. Repro steps no longer produce the bug.
2. Existing intended behavior remains intact.
3. Regression check added (test/script/manual checklist).
4. `npm run lint` passes.
5. `npm run build` passes.

## Files Likely Touched
- `src/...`
- `src/...`

## Rollback Plan
- Revert commit/PR:
- Feature flag fallback:
- Data remediation required?:

## Guardrails (Must NOT Change)
- Do not alter role model semantics unless issue explicitly targets roles.
- Do not change auth provider.
- Do not broaden scope into unrelated architecture changes.
- Do not remove route protection or onboarding safety checks.

## Risk and Agent Mode
- Risk: `risk:low` | `risk:med` | `risk:high`
- Execution: `agent:solo` | `agent:swarm`

## Verification Evidence
Attach logs, screenshots, GIFs, or failing/passing output as applicable.
