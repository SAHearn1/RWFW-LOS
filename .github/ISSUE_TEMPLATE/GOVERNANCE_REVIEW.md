# Weekly Governance Review

name: Weekly Governance Review
about: Track release quality, risk posture, and swarm execution discipline.
title: "[Governance] YYYY-MM-DD Weekly Review"
labels: ["area:docs", "type:chore", "risk:low", "agent:solo"]

## Scope
### In Scope
- Weekly review of release quality, issue flow, and guardrail adherence.
### Out of Scope
- New feature implementation.

## Dependencies
- Release gate artifacts from current week.

## Acceptance Criteria
1. Release gate trends reviewed and documented.
2. Open high-risk issues triaged with owners and next actions.
3. Swarm collision incidents (if any) documented and remediated.

## Files Likely Touched
- `docs/status/PROGRAM_STATUS.md`
- `docs/status/SLO_POLICY.md`

## Rollback Plan
- N/A for documentation-only governance review.

## Guardrails
- Do not alter product logic in governance review tickets.
