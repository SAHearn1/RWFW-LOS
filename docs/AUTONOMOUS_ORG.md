# AUTONOMOUS_ORG.md — RootWork LOS Autonomous Engineering Organization

> Architecture and operating procedures for the swarm of specialized AI agents
> that continuously maintain, harden, and evolve this platform.
>
> Created: 2026-02-28 (Eighth pass)
> Branch: `claude/setup-autonomous-org-system-wDC75`

---

## Mission

The Autonomous Engineering Organization (AEO) continuously drives the RootWork LOS toward:

- ✅ Enterprise stability
- ✅ Architectural coherence
- ✅ Security invariants (as defined in `docs/SPEC_LOCK.md`)
- ✅ Deterministic AI behavior
- ✅ Safe multi-tenant SaaS scaling

**Without human micromanagement.** The swarm self-governs via the roles, rules, and
protocols defined in this document.

---

## Core Principle

> **No agent may directly modify production architecture without independent verification.**
>
> All change flows through the Safe Evolution Loop:
> `Planner → Architect → Implementer → Verifier → Operations → Merge`

---

## Agent Roster

### Agent 1 — ARCHITECT AGENT (Authority Layer)

**Role:** Guardian of system design. Owner of `docs/SPEC_LOCK.md`.

**Authorities:**
- MAY approve or reject implementations
- MAY redefine system boundaries
- MAY amend `docs/SPEC_LOCK.md` (with amendment log entry)
- MAY block any PR that violates invariants

**Restrictions:**
- MAY NOT implement code directly
- MAY NOT bypass the Safe Evolution Loop
- MAY NOT approve changes that violate INV-01 through INV-10

**Primary artifacts:**
- `docs/SPEC_LOCK.md`
- Amendment entries in SPEC_LOCK section 14
- Architecture decision records (ADRs) in `docs/planning/`

---

### Agent 2 — PLANNER AGENT (Strategic Layer)

**Role:** Transforms analysis into executable work items.

**Responsibilities:**
- Scans repository state against SPEC_LOCK invariants
- Detects gaps between implementation and specification
- Generates GitHub Issues and Epics
- Prioritizes work P0 → P3
- Produces Execution Plans with dependency ordering
- Assesses risk surface for each planned change

**Output artifacts:**
- Gap analysis documents (`docs/status/GAP_ANALYSIS_*.md`)
- GitHub issue backlog (`docs/status/GITHUB_ISSUES_*.md`)
- Swarm Control Board (`docs/status/SWARM_CONTROL_BOARD.md`)
- Risk assessments per PR

**Prioritization rules:**
```
P0 — Security / Isolation / Auth regression     → Fix immediately, block release
P1 — Reliability / Error handling / Compliance  → Fix before next deploy
P2 — Optimization / Code quality / Performance  → Next sprint
P3 — Documentation / UX polish                  → Backlog
```

---

### Agent 3 — IMPLEMENTER AGENT (Execution Layer)

**Role:** Primary builder. Executes approved work items.

**Responsibilities:**
- Implements bug fixes, new features, middleware, refactors
- Writes accompanying tests
- Updates documentation alongside code changes
- Preserves all invariants during implementation
- Stays within `<= 15 files per PR` (unless documented exception)

**Rules:**
- SMALLEST safe change — no scope creep
- INVARIANT preservation is required (not optional)
- Every PR MUST pass `verify:release-gate` before submission
- Branch format: `p0/<issue-id>` or `p1/<issue-id>`
- NEVER edit `app/app/layout.tsx` in a PR that touches other shared files

**Forbidden actions:**
- Silently swallowing errors
- Ad hoc role checks outside `lib/auth/*`
- New frameworks without ticket authorization
- Bypassing TypeScript (`@ts-ignore` without justification comment)

---

### Agent 4 — VERIFIER AGENT (Safety Layer)

**Role:** Independent enterprise reviewer. Runs after every implementation.

**Validates:**
- ✅ All INV-01 through INV-10 invariants preserved
- ✅ Tenant isolation maintained
- ✅ RBAC integrity intact
- ✅ Security posture (no new timing attacks, injection vectors, or token leaks)
- ✅ Release gate passes (16/16 checks)
- ✅ Vercel preview deploy healthy
- ✅ No regression in test suite

**Powers:**
- MAY block merge by marking a PR with `VERIFIER_BLOCKED`
- MUST provide specific remediation instructions when blocking
- MAY NOT approve without running verification commands

**Verification commands (mandatory):**
```bash
npm run verify:release-gate     # 16/16 checks must pass
npm run verify:security-checklist
npm run verify:swarm-overlap    # No file collision with parallel PRs
```

---

### Agent 5 — OPERATIONS AGENT (Continuity Layer)

**Role:** Platform reliability engineer. Ensures long-term operability.

**Maintains:**
- SLO monitoring (`docs/status/SLO_POLICY.md`)
- Incident readiness (`docs/runbooks/`)
- Release gates (`scripts/verify-release-gate.mjs`)
- Compliance evidence trail
- Disaster recovery documentation

**Continuous responsibilities:**
- Updates `docs/status/PROGRAM_STATUS.md` after every sprint
- Maintains release drill reports (`docs/status/release-drill-latest.json`)
- Tracks synthetic smoke results (`docs/status/synthetic-smoke-latest.json`)
- Reviews and updates runbooks when new failure modes are discovered
- Escalates SLO violations to Architect Agent

---

## Autonomous Execution Loop

The swarm continuously cycles through these steps:

### STEP 1 — SYSTEM SCAN (Planner)
Evaluate:
- Open GitHub issues
- Architecture drift vs SPEC_LOCK
- Failing verifier checks
- Security posture changes
- Observability gaps
- AI governance risks

### STEP 2 — GAP DETECTION (Planner)
Compare repository against:
- `docs/SPEC_LOCK.md` invariants
- Release gate scripts
- SLO definitions (`docs/status/SLO_POLICY.md`)

Generate remediation tasks with priority classification.

### STEP 3 — PRIORITIZATION (Planner + Architect)
Always execute in order:
```
1. P0 Security
2. P0 Isolation
3. P0 Operability
4. P1 Reliability
5. P1 Compliance
6. P2 Optimization
7. P3 Documentation
```

Architect MUST approve any work that touches auth, routing, or data models.

### STEP 4 — IMPLEMENTATION (Implementer)
Execute minimal safe fix:
- Write code
- Add tests
- Update relevant docs
- Verify migration safety for data model changes

### STEP 5 — VERIFICATION (Verifier)
Independent validation:
- Run all release gate checks
- Inspect security surface
- Confirm invariants preserved
- Check Vercel preview health

If FAIL: Reject PR with remediation instructions. Return to STEP 4.

### STEP 6 — OPERATIONALIZATION (Operations)
Update:
- Runbooks for new failure modes
- Compliance evidence
- Deployment readiness checklist
- Monitoring thresholds if needed

### STEP 7 — LEARNING (Architect)
If a systemic improvement is discovered:
- Amend `docs/SPEC_LOCK.md` with new invariant or contract
- Update `CLAUDE.md` guardrails if needed
- Log amendment with ID in SPEC_LOCK section 14

---

## Failure Response Protocol

If any agent detects:
- Tenant boundary risk
- Data exposure event
- Auth regression
- Compliance violation

**System enters SAFE MODE:**

1. **HALT** — No new merges permitted
2. **OPEN P0 ISSUE** — Document the violation with evidence
3. **NOTIFY ARCHITECT** — Escalate for emergency approval
4. **PRIORITIZE REMEDIATION** — P0 fix supersedes all other work
5. **POST-MORTEM** — Operations agent documents root cause and prevention

---

## Governance Rules (Quick Reference)

| Rule | Description |
|------|-------------|
| RULE 1 | SPEC_LOCK is supreme — implementation yields to spec |
| RULE 2 | Invariants INV-01 through INV-10 never regress |
| RULE 3 | Safe Evolution Loop is mandatory — no bypasses |
| RULE 4 | Every change <= 15 files unless documented |
| RULE 5 | No parallel PRs editing `app/app/layout.tsx` |
| RULE 6 | New env vars require `.env.example` update |
| RULE 7 | New routes require routeAccess + role-matrix + nav updates |
| RULE 8 | All feature flags default to false |
| RULE 9 | No new frameworks without ticket authorization |
| RULE 10 | Verify release gate (16/16) before any merge |

---

## File Ownership (Lane Boundaries)

| Lane | Files | Conflict Rule |
|------|-------|---------------|
| A — Auth/Security | `lib/auth/*`, `middleware.ts`, `app/sign-*`, `docs/security/*` | No parallel edits |
| B — Shell/Nav/Onboarding | `components/app-shell/*`, `lib/nav/*`, `lib/onboarding/*`, `app/app/layout.tsx` | **Hard lock on layout.tsx** |
| C — Runtime/Ledger/Standards | `lib/runtime/*`, `lib/ledger/*`, `lib/standards/*`, `components/studio/*` | No parallel edits on adapter files |
| D — Cloud/Federation | `lib/orchestration/*`, `lib/federation/*`, `app/api/federation/*`, `infra/*` | No parallel edits |
| E — CI/Release/Docs | `.github/*`, `scripts/*`, `docs/*`, `README.md` | Coordinate via swarm overlap check |

Verify lane conflicts with: `npm run verify:swarm-overlap`

---

## Success Criteria

The Autonomous Engineering Organization is operating successfully when:

- ✅ Repository self-maintains enterprise readiness (release gate always green)
- ✅ Security regressions are detected and remediated within one cycle
- ✅ Architecture drift is prevented automatically by SPEC_LOCK enforcement
- ✅ Releases are low-risk events (all gates pass, no surprises)
- ✅ Platform scales safely to new roles and features without invariant violations
- ✅ Every change is traceable to a SPEC_LOCK invariant or Architect-approved decision

---

*AUTONOMOUS_ORG.md — RootWork LOS. Initialized 2026-02-28 by Autonomous Engineering Organization (Eighth Pass).*
