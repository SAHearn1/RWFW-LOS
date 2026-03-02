# UX Gap Analysis by User Role (Operability vs Spec)

**Date:** 2026-02-28  
**Specs referenced:** `docs/qa/role-matrix.md`, `docs/qa/manual-role-e2e-checklist.md`, `docs/qa/browser-quality-smoke.md`

## Operability Definition Used
A role is considered **fully operable** when all of the following are true for its intended workflow:
1. Route access and navigation are correct (no role leakage / no missing destinations).
2. Critical first-session tasks are executable ("First 60 Seconds" outcomes).
3. Core pages for that role are functional (not placeholder-only).
4. Feature dependencies (flags/env/org bindings) are discoverable and fail gracefully.
5. Required QA evidence can be captured and repeated.

## Role-by-Role UX Assessment

### 1) `student_independent`
**Intended journey (spec):** `/app` → `/app/missions` → `/app/studio` → `/app/credentials` (+ portfolio/settings).  
**Current UX state:**
- Home and shell navigation exist; mission draft/start/submit is available from learner home.
- `missions`, `studio`, and `portfolio` are still defined as placeholder-level in the role matrix.
- `credentials` and `settings` are wired, but depend on runtime/health integrations.

**Operability gaps:**
- End-to-end learner production flow is incomplete due to placeholder pages in key creation/review surfaces.
- First-60-seconds requirement to produce a minimal artifact is at risk when placeholder behaviors are encountered.
- Runtime dependency visibility exists, but task completion confidence is weak without complete mission/studio workflow.

**Needed for full operability:**
- Promote `missions`, `studio`, and `portfolio` from placeholder to functional.
- Add success-state UX confirmations for artifact created/submitted/review-ready.
- Add deterministic empty-state guidance linking next best action (e.g., "Go to Studio", "Submit for Review").

---

### 2) `student_enrolled`
**Intended journey (spec):** same functional path as `student_independent`, with organization context.  
**Current UX state:**
- Same learner pages and placeholders as independent learner.
- Additional org requirement can block shell access if org assignment is missing.

**Operability gaps:**
- Same learner feature-completeness gap as above.
- Enrollment/org dependency introduces a hard stop with no self-service remediation path.

**Needed for full operability:**
- Complete learner placeholder routes.
- Add "organization required" remediation UX with actionable support path and retry guidance.

---

### 3) `adult_learner`
**Intended journey (spec):** learner flow with adult-focused home messaging and same learner route set.  
**Current UX state:**
- Role-specific home exists and points to mission/artifact progression.
- Downstream flow still inherits learner placeholder constraints (`missions`, `studio`, `portfolio`).

**Operability gaps:**
- Home message quality is ahead of downstream capability; expectation/reality mismatch.
- Artifact and portfolio progression lacks full execution fidelity.

**Needed for full operability:**
- Functional parity across learner routes.
- Role-specific progress indicators that map to real completion states.

---

### 4) `teacher`
**Intended journey (spec):** `/app` → `/app/command-center` → `/app/cohorts` → `/app/reviews` (+ optional pickups/builder).  
**Current UX state:**
- Command Center, Cohorts, Reviews, and Builder are marked functional.
- Pickups is wired but feature-flag gated.
- Some facilitator pages are data-dependent on learner mission generation (can appear empty until learner activity exists).

**Operability gaps:**
- Operability is environment-sensitive: with no learner-generated records, UX can appear inert.
- Pickup workflow is not consistently available unless flag-enabled and configured.

**Needed for full operability:**
- Seed/synthetic data mode for zero-data environments.
- Explicit in-product guidance on required preconditions when queues are empty.
- Promote pickups from wired to functional or hide until enabled with clear affordance.

---

### 5) `professional_development`
**Intended journey (spec):** facilitator flow parallel to teacher with PD framing.  
**Current UX state:**
- Access and route protection align with facilitator routes.
- Shared dependency profile with teacher (data/flag sensitivity).

**Operability gaps:**
- Same empty-state and feature-flag sensitivity as teacher role.
- PD-specific outcomes are described at home but not distinctly represented in downstream tooling behavior.

**Needed for full operability:**
- PD-specific queue filters/goals and measurable completion states.
- Better tie between PD dashboard language and actionable task surfaces.

---

### 6) `admin`
**Intended journey (spec):** `/app` → `/app/evidence` → `/app/exports` (+ standards).
**Current UX state:**
- Evidence, Exports, and Standards are marked functional.
- Evidence path can depend on DB flag/config for full backend-backed behavior.
- Super-admin boundaries are enforced (admin blocked from super-admin routes).

**Operability gaps:**
- Full fidelity varies by env configuration (local ledger vs DB path).
- Admin analytics/export confidence can drop when source-of-truth context is not explicit.

**Needed for full operability:**
- Always-visible data-source indicator (local ledger vs DB).
- Export provenance metadata in UI/download (timestamp, source mode, filter context).
- Admin runbook links in-product for retention/compliance routines.

---

### 7) `super_admin`
**Intended journey (spec):** dashboard + `/users`, `/teachers`, `/licenses`, `/institutions` with sole authority for teacher-role assignment.
**Current UX state:**
- Dedicated route set exists and is marked functional.
- Authority boundaries are explicit in docs and dashboard messaging.
- User/license/institution tooling exists with management workflows.

**Operability gaps:**
- Some KPIs on home remain non-live placeholders (e.g., `—`), reducing at-a-glance operational confidence.
- End-to-end audit visibility for role assignment/licensing actions is not surfaced directly in the UX.

**Needed for full operability:**
- Replace placeholder KPI cards with live counts and freshness timestamps.
- Add action-history panel (recent teacher grants/revokes, license events, institution delegation changes).
- Add explicit success/failure receipts for all critical authority actions.

## Cross-Role Gaps (Systemic)
1. **Placeholder debt in learner surfaces** is the largest blocker to end-to-end operability.
2. **Environment/flag sensitivity** (`runtime`, `pickups`, DB ledger mode) can create "works but feels broken" states if not explicitly explained.
3. **Empty-state guidance** needs stronger next-step CTAs tied to each role's operational objective.
4. **Evidence requirements** in the manual/browser QA specs are clear, but not all flows are easily demonstrable without seeded data.

## Priority Remediation Plan
1. **P0 — Learner completion loop:** mission creation → studio artifact → submission → credential/portfolio reflection.
2. **P0 — Facilitator observability:** deterministic seeded data and actionable empty-state prompts.
3. **P1 — Super admin operational telemetry:** live KPIs + recent actions/audit feed.
4. **P1 — Admin data provenance:** clear source-mode and export metadata.
5. **P2 — UX hardening:** first-60-seconds task instrumentation and route-level success metrics.

## Suggested Acceptance Criteria for "Fully Operable"
- Every role can complete one meaningful task in <60 seconds from sign-in.
- No role-required route is placeholder-only.
- All role dashboards show at least one live metric and one actionable CTA.
- Empty states provide role-correct next actions.
- QA checklist evidence can be collected in a fresh environment without manual data surgery.
