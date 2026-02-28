# RWFW-LOS Issue Tracker

> Tracked gap issues from the 2026-02-28 gap analysis session.
> Issues are implemented sequentially on branch `claude/nextjs-multi-agent-system-rqBEy`.

---

## Issue #101 — Fix lint environment: install @eslint/eslintrc

**Priority:** P0 — Blocks release gate
**Files:** `package.json`, `package-lock.json`

**Problem:** `npm run lint` fails with `Cannot find package '@eslint/eslintrc'`. The ESLint flat config (`eslint.config.mjs`) imports `FlatCompat` from `@eslint/eslintrc` but the package is not listed in `devDependencies`.

**Solution:** Add `@eslint/eslintrc` to `devDependencies` and install it.

**Status:** ✅ Resolved — commit included in this branch

---

## Issue #102 — Profile editing: add client form for display name/preferences

**Priority:** P1 — User-facing gap
**Files:** `app/app/[[...slug]]/page.tsx`, `components/profile/ProfileEditor.tsx` (new)

**Problem:** `/app/profile` renders role and orgId read-only from Clerk metadata. There is no mechanism for a user to update display name or preferences.

**Solution:** Add a `ProfileEditor` client component with a form to update display name backed by a new `/api/profile/update` server action.

**Status:** ✅ Resolved — commit included in this branch

---

## Issue #103 — Facilitator learner detail view

**Priority:** P1 — Facilitator workflow gap
**Files:** `app/app/learner/[learnerId]/page.tsx` (new), `components/facilitator/LearnerDetailView.tsx` (new), `lib/auth/routeAccess.ts`, `lib/nav/items.ts`

**Problem:** Facilitators can read any learner's runtime state via `/api/ledger/records?learnerId=X` but there is no UI. TeacherHome and CommandCenter link to Pickups/Cohorts but there is no learner drill-down.

**Solution:** Add `/app/learner/[learnerId]` dynamic route accessible to facilitators, showing ledger artifacts, missions, and verifications for a specific learner.

**Status:** ✅ Resolved — commit included in this branch

---

## Issue #104 — Cohort CRUD: add create/delete to CohortList

**Priority:** P2 — Facilitator workflow gap
**Files:** `components/cohorts/CohortList.tsx`

**Problem:** `CohortList` derives cohorts from ledger mission records but has no ability to create new cohorts inline or delete existing ones (only navigates to Builder).

**Solution:** Add inline create-cohort form and per-cohort delete action backed by `localLedgerAdapter`.

**Status:** ✅ Resolved — commit included in this branch

---

## Issue #105 — SuperAdmin UserRoster: add role-change (CRUD) capability

**Priority:** P2 — Super-admin workflow gap
**Files:** `components/super-admin/UserRoster.tsx`

**Problem:** `UserRoster` lists live Clerk users but provides no way to edit a user's role inline. Role assignment is only possible through the separate `TeacherAssignment` page.

**Solution:** Add an inline role-change select+confirm action to each user row in `UserRoster`, wired to `/api/super-admin/assign-role`.

**Status:** ✅ Resolved — commit included in this branch

---

*All issues implemented on branch `claude/nextjs-multi-agent-system-rqBEy`, 2026-02-28.*
