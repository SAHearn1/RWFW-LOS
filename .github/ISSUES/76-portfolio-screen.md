---
title: "[#76] Implement Portfolio screen for learner roles"
labels: ["type:feature", "risk:med", "agent:solo", "gap:GAP-04"]
---

## Summary

The `/app/portfolio` route renders a generic catch-all placeholder. Learner roles need an evidence portfolio view that surfaces their artifacts, verification results, and credential progress in one place.

## Problem / Outcome

Learners can save artifacts in Studio but have no dedicated screen to review them as a portfolio. The portfolio is the learner's primary evidence-of-growth artifact, required for credential progression.

## Scope

### In Scope
- [ ] Create `app/app/portfolio/page.tsx` (dedicated route)
- [ ] Create `components/portfolio/PortfolioView.tsx` — reads ledger records via `localLedgerAdapter.readAll()` filtered to current learner's artifacts and verifications
- [ ] Display artifact list with verification verdict badge (`pass` / `partial` / `missing`)
- [ ] Link to Studio for each artifact (deep-link to `/app/studio`)
- [ ] Empty state when no artifacts exist yet
- [ ] Role guard: restrict to `LEARNER_ROLES`

### Out of Scope
- [ ] Artifact editing (belongs to Studio)
- [ ] Credential issuance (belongs to Credentials screen)
- [ ] Teacher/admin views

## Dependencies
- [ ] `lib/ledger/adapter.ts` — `localLedgerAdapter.readAll()` (already implemented)
- [ ] `lib/runtime/contracts/types.ts` — `RuntimeArtifact`, `VerificationEvent` types
- [ ] `NEXT_PUBLIC_ENABLE_LEDGER` flag — component should degrade gracefully when false
- [ ] `/app/missions` (#75) — optional cross-link to mission context

## Acceptance Criteria (Testable)
1. Given a learner with saved artifacts, when they visit `/app/portfolio`, then each artifact is listed with its verification verdict.
2. Given `NEXT_PUBLIC_ENABLE_LEDGER=false`, when a learner visits `/app/portfolio`, then a graceful "Ledger not enabled" message is shown (no crash).
3. Given a `teacher` user, when they visit `/app/portfolio`, then ForbiddenPanel is shown.
4. `npm run lint` passes.
5. `npm run build` passes.

## Files Likely Touched
- `app/app/portfolio/page.tsx` *(new)*
- `components/portfolio/PortfolioView.tsx` *(new)*
- `docs/qa/role-matrix.md` *(add missing row for `/app/portfolio` — GAP-20)*

## Rollback Plan
- Revert strategy: delete `app/app/portfolio/page.tsx` to fall back to catch-all placeholder
- Data impact: none (reads ledger; no writes)

## Guardrails (Must NOT Change)
- Do not modify `lib/ledger/adapter.ts`
- Do not change route access contract for `/app/portfolio`
- Do not introduce new frameworks
- Do not edit `app/app/layout.tsx`

## Risk and Agent Mode
- Risk: `risk:med`
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run verify:role-routes`
- Route: `/app/portfolio` as `student_independent` with ledger flag on — renders artifact list
- Route: `/app/portfolio` as `teacher` — ForbiddenPanel
