# RootWork LOS — Agentic Build Spine (Next.js Shell + LOS Core)
> **Primary goal:** Build a Vercel-native Next.js “front door” (landing + auth + nav + onboarding) that wraps the existing LOS prototype **without destabilizing it**, while we layer in the deterministic LOS spine services behind stable contracts.

## Stack + Workflow
- **Repo:** GitHub (single repo preferred; Next.js app at root)
- **Deploy:** Vercel (Preview Deployments required)
- **AI Build:** Codex (agent swarm permitted, but governed—see Guardrails)
- **Language/Framework:** Next.js (App Router), TypeScript
- **UI:** Tailwind (existing conventions)
- **Auth:** Clerk (recommended for speed on Vercel; supports roles/orgs)
- **Quality Gates:** ESLint + TypeScript + `next build` must pass on every PR

---

## Non-Negotiable Product Requirements (Phase 1)
1. **Landing Page (public)**
   - Clear value prop, “first 60 seconds” flow, privacy/safety section, CTAs for:
     - Independent Learner
     - Teacher
     - Administrator
2. **Authentication + Roles**
   - Roles: `student_independent`, `student_enrolled`, `teacher`, `admin`
   - Route protection and role-aware navigation
3. **App Shell Navigation**
   - Student: Home (PLE), Missions, Studio, Portfolio, Credentials, Settings
   - Teacher: Command Center, Cohorts, Pickups, Reviews, Builder (placeholder)
   - Admin: Standards, Evidence, Exports (placeholder)
4. **Guided Onboarding**
   - Tour UI that highlights elements using `data-tour="..."` attributes
   - Role-based tours with feature-flag-aware step skipping
5. **Stability Preservation**
   - Current prototype screens must continue to run (even if temporarily embedded) while we migrate.

---

## Architecture Decisions (Keep This Deterministic)
### Shell-first: Next.js as “Front Door”
- Next.js owns:
  - landing
  - auth
  - navigation shell
  - onboarding
  - route protection
- Existing LOS prototype is mounted as **Core Screens** under `/app/*` routes, then migrated screen-by-screen.

### Feature Flags (Required from day one)
Define environment-driven flags and use them in UI + onboarding:
- `NEXT_PUBLIC_ENABLE_LEDGER`
- `NEXT_PUBLIC_ENABLE_MCP`
- `NEXT_PUBLIC_ENABLE_PICKUP`
- `NEXT_PUBLIC_ENABLE_OFFLINE`
- `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT` (temporary)

---

## Guardrails for Agent Swarms (MANDATORY)
> This project will be developed with multiple Codex agents. These guardrails prevent chaos and preserve build stability.

### Branching + PR Policy
- **One PR per issue ticket** (no mega-PRs).
- Each PR must be small, reviewable, and pass all checks.
- PR title format: `[#ISSUE] Short scope summary`
- Do not merge if:
  - TypeScript fails
  - `next build` fails
  - routes break role protection
  - onboarding steps break when flags are off

### Ownership Boundaries (No Agent Overreach)
Agents must NOT:
- introduce new frameworks (unless ticket explicitly authorizes)
- refactor unrelated code
- change auth provider decisions
- alter role model semantics
- add heavy backend services in Phase 1
- “improve” UI visuals beyond scope

### Change Budget
- **Max 15 files changed** per PR unless explicitly approved.
- Prefer additive changes with adapters over rewrites.

### Contracts Before Implementation
For anything “core” (auth roles, routes, onboarding, feature flags):
- Define the interface/contract in code first (types + constants + doc comments)
- Then implement; no ad hoc logic.

### Determinism Rules
- No hidden “magic” behavior.
- Every role/route decision must be explicit.
- Tours must skip missing elements; never crash.

### Conflict Avoidance
- Agents must check active PRs and avoid overlapping files.
- If overlap is unavoidable, coordinate by:
  1) making a tiny PR introducing shared types/constants
  2) then implementing separately.

### Test/Verification Minimums
Every PR must include:
- How to test locally (commands + routes)
- Screenshots/GIF (if UI changed)
- Any new env vars documented in `.env.example`

---

## Definition of Done (DOD)
A ticket/PR is “done” only if:
- ? builds on CI (`npm run lint` + `npm run build`)
- ? Vercel preview deploy succeeds
- ? role protections work (unauth redirects; wrong-role blocks)
- ? navigation renders correct items for each role
- ? onboarding tour runs without error and can be restarted
- ? documentation updated (`README.md`, `.env.example`)

---

## Local Setup
1. Install deps:
   - `npm install`
2. Set env vars:
   - Copy `.env.example` ? `.env.local`
   - Fill Clerk keys + flags
3. Run:
   - `npm run dev`
4. Verify:
   - `/` landing loads
   - `/app` requires login
   - tours run on first login

---

## Project Phases (Do NOT skip order)
### Phase 1 — Front Door + Shell (this sprint)
- Next.js app + landing
- Clerk auth + roles
- nav shell + protected routes
- guided onboarding

### Phase 2 — Core Screen Mounting
- mount existing PLE/Studio/Console under `/app/*`
- implement adapters to keep state stable

### Phase 3 — LOS Runtime + Ledger + Standards (separate epic)
- add `rwle-runtime` (local)
- evidence ledger (local-first)
- standards verification layer

---

## “First 60 Seconds” Acceptance Scenario (must pass)
1. User visits landing `/`
2. Clicks “Start as Independent Learner”
3. Signs up / logs in
4. Tour runs (6–10 steps)
5. Lands on PLE
6. Starts a mission (even placeholder)
7. Produces an artifact (even minimal, locally stored)

If this flow works, the build spine is alive.
