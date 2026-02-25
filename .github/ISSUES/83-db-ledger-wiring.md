---
title: "[#83] Wire DB ledger adapter via NEXT_PUBLIC_ENABLE_DB_LEDGER flag (GAP-11)"
labels: ["type:chore", "risk:med", "agent:solo", "gap:GAP-11"]
---

## Summary

`createDbLedgerAdapter()` is a fully implemented SQLite ledger adapter in `lib/ledger/dbAdapter.ts`. A `shouldUseDbLedger()` helper also exists and correctly reads the `NEXT_PUBLIC_ENABLE_DB_LEDGER` flag. However, no consumer ever calls `shouldUseDbLedger()` — all three ledger consumers (`StudioWorkspace`, `CredentialsSummary`, `AdminEvidenceView`) import `localLedgerAdapter` directly and unconditionally. Enabling the flag currently has zero effect.

## Problem / Outcome

The DB ledger is a fully built feature that is silently dead. Setting `NEXT_PUBLIC_ENABLE_DB_LEDGER=true` does nothing. This means ledger data is never persisted to SQLite in any deployment configuration that expects durable storage.

## Scope

### In Scope
- [ ] In `components/studio/StudioWorkspace.tsx`: replace direct `localLedgerAdapter` import with `shouldUseDbLedger() ? createDbLedgerAdapter() : localLedgerAdapter`
- [ ] In `components/credentials/CredentialsSummary.tsx`: same conditional
- [ ] In `components/evidence/AdminEvidenceView.tsx`: same conditional
- [ ] Ensure `createDbLedgerAdapter()` is only instantiated once per component mount (memoize or module-level singleton if appropriate)

### Out of Scope
- [ ] Changes to `lib/ledger/dbAdapter.ts` or `lib/ledger/adapter.ts` implementation
- [ ] Adding new ledger methods
- [ ] Migration tooling for existing localStorage data

## Dependencies
- [ ] `lib/ledger/dbAdapter.ts` — `createDbLedgerAdapter()`, `shouldUseDbLedger()` (fully implemented)
- [ ] `lib/ledger/adapter.ts` — `localLedgerAdapter` (in use today)
- [ ] `NEXT_PUBLIC_ENABLE_DB_LEDGER` env var — must be documented in `.env.example` (verify it is already listed)

## Acceptance Criteria (Testable)
1. Given `NEXT_PUBLIC_ENABLE_DB_LEDGER=true`, when `StudioWorkspace` saves an artifact, then `createDbLedgerAdapter().upsert()` is called (not `localLedgerAdapter`).
2. Given `NEXT_PUBLIC_ENABLE_DB_LEDGER=false` (or unset), all three consumers use `localLedgerAdapter` — existing behavior preserved.
3. No crash occurs when switching between adapters across page loads.
4. `npm run lint` passes.
5. `npm run build` passes.
6. `npm run typecheck` passes.

## Files Likely Touched
- `components/studio/StudioWorkspace.tsx`
- `components/credentials/CredentialsSummary.tsx`
- `components/evidence/AdminEvidenceView.tsx`
- `.env.example` *(verify `NEXT_PUBLIC_ENABLE_DB_LEDGER` is listed; add if missing)*

## Rollback Plan
- Feature flag: set `NEXT_PUBLIC_ENABLE_DB_LEDGER=false` to revert to localStorage adapter without code change
- Revert strategy: revert the three consumer files to direct `localLedgerAdapter` imports
- Data impact: SQLite DB file (`ledger.db`) created on first write; harmless to delete

## Guardrails (Must NOT Change)
- Do not modify `lib/ledger/dbAdapter.ts` or `lib/ledger/adapter.ts`
- Do not change the `LedgerAdapter` interface contract
- Do not modify other components beyond the three listed
- Do not edit `app/app/layout.tsx`

## Risk and Agent Mode
- Risk: `risk:med` (touches three components; flag gate limits blast radius)
- Execution: `agent:solo`

## Verification Plan
- `npm run lint`
- `npm run build`
- `npm run typecheck`
- Manual: set `NEXT_PUBLIC_ENABLE_DB_LEDGER=true`, save an artifact in Studio, verify `ledger.db` is written
- Manual: set flag false, verify localStorage adapter still works
