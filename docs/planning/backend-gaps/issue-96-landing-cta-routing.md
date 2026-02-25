# Issue #96 — GAP-15: Landing page CTA routing fixes

**Branch:** `claude/landing-cta-RHg64`
**Label:** ux, gap, small
**Closes:** GAP-15

## Context

`app/page.tsx` has three CTAs:
1. "Start as Independent Learner" → `/sign-up` ✅ correct
2. "Teacher Login" → `/sign-in` ⚠️ works but no role context
3. "Admin Info" → `/admin-info` ❌ **404** — this route does not exist anywhere

The sign-in page (`app/sign-in/[[...sign-in]]/page.tsx`) renders Clerk's `<SignIn />`
component with no contextual messaging. It cannot pass role metadata to Clerk, but it
can display a role-appropriate note above the Clerk widget.

## Acceptance Criteria

### Fix 1: `app/page.tsx`

- Change "Admin Info" `href` from `/admin-info` to `/sign-in?role=admin`
- Change "Teacher Login" `href` from `/sign-in` to `/sign-in?role=teacher`
- No other changes to layout, copy, or styling

### Fix 2: `app/sign-in/[[...sign-in]]/page.tsx`

Convert to a server component that reads the `role` search param and shows a
contextual note above `<SignIn />`:

```typescript
// Pseudocode — implement properly:
export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  // Show a note if role is "teacher" or "admin"
}
```

Role note content (render above `<SignIn />`):
- `role === "teacher"`: "Signing in as a teacher. Your account must be associated with an organization."
- `role === "admin"`: "Signing in as an administrator. Contact your organization owner if access is restricted."
- Any other value or no value: no note shown

Note styling: small `<p>` with `text-sm text-slate-600 mb-4 text-center`. Keep the
outer `<main>` layout unchanged.

## Guardrails

- **Touch only:** `app/page.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`
- **Do NOT touch:** `app/app/layout.tsx` (hard guardrail), any component or lib file
- Max 2 files changed
- Do NOT add a Clerk `initialValues` or `unsafeMetadata` prop — just a display note
- The `<SignIn />` component must remain unchanged

## Definition of Done

- `npm run lint` exits 0
- `npm run typecheck` exits 0
- `/` → "Admin Info" → `/sign-in?role=admin` with note visible ✅
- `/` → "Teacher Login" → `/sign-in?role=teacher` with note visible ✅
- `/` → "Start as Independent Learner" → `/sign-up` (unchanged) ✅
- Commit and push to `claude/landing-cta-RHg64`
