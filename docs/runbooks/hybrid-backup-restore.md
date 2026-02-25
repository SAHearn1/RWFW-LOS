# Hybrid Backup and Restore Runbook

Status: Operational draft
Last Updated: 2026-02-25

## Backup Scope
- Local runtime state (`rootwork.runtime.state`)
- Local ledger records (`rootwork.ledger.records`)
- Optional DB ledger file (`rootwork-ledger.db`)
- Release gate evidence (`docs/status/release-gate-latest.json`)

## Backup Procedure
1. Run `npm run verify:release-gate` and confirm pass.
2. Export local browser storage for runtime and ledger keys.
3. If DB ledger is enabled, copy `rootwork-ledger.db` to secure storage.
4. Archive `docs/status/release-gate-latest.json` with timestamp.

## Restore Procedure
1. Restore runtime and ledger state from latest approved backup.
2. Restore `rootwork-ledger.db` if DB ledger mode is used.
3. Re-run:
- `npm run verify:env`
- `npm run verify:env-parity`
- `npm run verify:release-gate`
4. Validate role smoke: `npm run verify:role-e2e`.

## Rollback Trigger
- Any post-restore verifier failure or role-access regression.

## Notes
- Keep backup artifacts per environment (dev/preview/prod evidence).
- Never store webhook secrets inside backup artifacts.
