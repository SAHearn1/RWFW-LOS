# Threat Model (STRIDE)

Status: Draft for engineering acceptance gates (operational guidance, not legal advice)
Last Updated: 2026-02-25

## System Boundaries
- Public routes: `/`, `/sign-in`, `/sign-up`
- Protected shell routes: `/app/*`
- API routes: `/api/federation`, `/api/health`, `/api/webhooks/clerk`
- Data stores: local runtime state, local ledger, optional DB ledger, orchestration placeholders

## STRIDE Risks

### Spoofing
- Risk: forged webhook/event callers.
- Control: signature verification in Clerk webhook route and secret rotation protocol.
- Gate: `npm run verify:webhook-contract` must pass.

### Tampering
- Risk: unauthorized mutation of route access contracts or role nav.
- Control: deterministic role/route verifier + matrix docs sync.
- Gate: `npm run verify:role-routes` must pass.

### Repudiation
- Risk: inability to attribute critical actions.
- Control: trace IDs + audit log entries for federation/webhook actions.
- Gate: `npm run verify:engine-smoke` + API checks in release gate.

### Information Disclosure
- Risk: role-based data leakage across learner/teacher/admin scopes.
- Control: route access contracts, forbidden route checks, matrix assertions.
- Gate: `npm run verify:role-routes` and role E2E smoke.

### Denial of Service
- Risk: bad env or provider outage causes broad app failures.
- Control: env verifiers, safe fallback behavior, health endpoint.
- Gate: `npm run verify:env`, `npm run verify:env-parity`, `npm run verify:http-smoke`.

### Elevation of Privilege
- Risk: role spoofing or bypass to privileged routes.
- Control: middleware auth guard + in-app role checks + 403 boundaries.
- Gate: `npm run verify:role-routes`, role E2E checks.

## Security Acceptance Checks
- [ ] All release-gate verifiers pass.
- [ ] Webhook secret present and rotated if suspicious traffic observed.
- [ ] Role matrix updated for any access change.
- [ ] Audit log path writable and inspected on incidents.
