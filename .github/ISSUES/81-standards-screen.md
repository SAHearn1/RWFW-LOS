---
title: "[#81] Implement Standards admin screen"
labels: ["type:feature", "risk:med", "agent:solo", "gap:GAP-08"]
---

## Summary

The `/app/standards` route renders a generic catch-all placeholder. Admins need a Standards registry view to inspect active verification standards and their keyword rules. This is also the entry point for resolving GAP-28 (standards are currently hardcoded).

## Problem / Outcome

The standards verifier runs in Studio but admins have no visibility into which standards are active or how they are configured. The `/app/standards` admin screen is a prerequisite for any future standards management capability.

## Scope

### In Scope
- [ ] Create `app/app/standards/page.tsx` (dedicated route)
- [ ] Create `components/standards/StandardsRegistry.tsx` — read-only table of active standards from `DEFAULT_STANDARDS` in `lib/standards/verifier/localVerifier.ts`
- [ ] Each row shows: standard ID, label, keyword list, enabled status
- [ ] Role guard: restrict to `admin`

### Out of Scope
- [ ] Admin ability to add/modify/disable standards (GAP-28 — tracked separately)
- [ ] Plugin system wiring (GAP-26 — tracked separately)
- [ ] Standards import/export

## Dependencies
- [ ] `lib/standards/verifier/localVerifier.ts` — `DEFAULT_STANDARDS` (already implemented)
- [ ] `lib/standards/contracts/types.ts` — `StandardDescriptor` type
- [ ] `lib/auth/routeAccess.ts` — `/app/standards` already defined as admin-only
- [ ] `docs/qa/role-matrix.md` — `/app/standards` row missing (GAP-20); add it in this PR

## Acceptance Criteria (Testable)
1. Given an `admin` user, when they visit `/app/standards`, then they see the standards registry table, not a placeholder.
2. All entries from `DEFAULT_STANDARDS` appear in the table with ID, label, and keywords visible.
3. Given a `teacher` user, when they visit `/app/standards`, then ForbiddenPanel is shown.
4. `docs/qa/role-matrix.md` has a row for `/app/standards` (admin-only).
5. `npm run lint` passes.
6. `npm run build` passes.

## Files Likely Touched
- `app/app/standards/page.tsx` *(new)*
- `components/standards/StandardsRegistry.tsx` *(new)*
- `docs/qa/role-matrix.md` *(add missing row — partial fix for GAP-20)*

## Rollback Plan
- Revert strategy: delete `app/app/standards/page.tsx` to fall back to catch-all placeholder
- Data impact: none (read-only; reads hardcoded constants)

## Guardrails (Must NOT Change)
- Do not modify `lib/standards/verifier/localVerifier.ts` `DEFAULT_STANDARDS` in this ticket
- Do not modify standards plugin contracts
- Do not introduce new frameworks
- Do not edit `app/app/layout.tsx`

## Risk and Agent Mode
- Risk: `risk:med`
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run verify:role-routes`
- Route: `/app/standards` as `admin` — renders StandardsRegistry
- Route: `/app/standards` as `teacher` — ForbiddenPanel
