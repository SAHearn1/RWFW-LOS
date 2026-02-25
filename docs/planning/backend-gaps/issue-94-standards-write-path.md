# Issue #94 — GAP-28: Standards admin write path + verifier wiring

**Branch:** `claude/standards-write-RHg64`
**Label:** backend, gap, admin, small
**Closes:** GAP-28

## Context

Two components exist for the Standards admin screen:
- `components/standards/StandardsRegistry.tsx` — read-only view, imports `DEFAULT_STANDARDS` directly
- `components/standards/StandardsManager.tsx` — full add/edit/delete UI, already uses
  `readConfiguredStandards()` / `writeConfiguredStandards()` from `lib/standards/configStore.ts`

`app/app/standards/page.tsx` renders `StandardsRegistry` (read-only). `StandardsManager`
is fully implemented but never mounted anywhere.

Additionally, the Studio verification pipeline is hardcoded to `DEFAULT_STANDARDS`:

```typescript
// lib/standards/plugins/defaultPlugins.ts:15
standards: [...DEFAULT_STANDARDS]   // ← never reads configured standards
```

`StudioWorkspace.tsx:104` calls `runDefaultStandardsPlugins(artifactDraft)` which uses this
hardcoded list. Admin-configured standards have no effect on Studio verification.

## Acceptance Criteria

### Fix 1: Standards page renders `StandardsManager`

In `app/app/standards/page.tsx`:
- Change import from `StandardsRegistry` to `StandardsManager`
- Change `<StandardsRegistry />` to `<StandardsManager />`
- One import swap, one JSX element swap — nothing else

### Fix 2: `runDefaultStandardsPlugins` reads configured standards

In `lib/standards/plugins/defaultPlugins.ts`:
- Add import: `import { readConfiguredStandards } from "@/lib/standards/configStore";`
- In `runDefaultStandardsPlugins`, replace `[...DEFAULT_STANDARDS]` with a runtime read:
  ```typescript
  const standards = typeof window !== "undefined"
    ? readConfiguredStandards()
    : [...DEFAULT_STANDARDS];
  ```
  (Server-side guard required because `configStore` uses `window.localStorage`.
  `StudioWorkspace` is a client component so the localStorage path is always used
  in normal runtime. The fallback keeps SSR/build safe.)

## Guardrails

- **Touch only:** `app/app/standards/page.tsx`, `lib/standards/plugins/defaultPlugins.ts`
- **Do NOT touch:** `StandardsRegistry.tsx`, `StandardsManager.tsx`, `configStore.ts`,
  `localVerifier.ts`, `StudioWorkspace.tsx`, `contracts/plugins.ts`
- **Do NOT touch:** `app/app/layout.tsx` (hard guardrail)
- Max 2 files changed, minimal diff per file

## Verification

1. Navigate to `/app/standards` as admin → see `StandardsManager` (add/remove form visible)
2. Add a custom standard in the UI
3. Go to `/app/studio`, write artifact containing new standard's keywords
4. Verification summary should show the new standard as matched

## Definition of Done

- `npm run lint` exits 0
- `npm run typecheck` exits 0
- Commit and push to `claude/standards-write-RHg64`
