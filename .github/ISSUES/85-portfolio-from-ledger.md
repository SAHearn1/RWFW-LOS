# [#85] FEATURE: Portfolio populated from real ledger data

## Problem
`PortfolioView` (`components/portfolio/PortfolioView.tsx`) currently shows a
static placeholder message when the ledger flag is disabled, and shows nothing
meaningful when it's enabled. Trial learners have no way to see the artifacts
they saved in Studio.

## Scope
Lane C — Runtime/Ledger/Standards

## Expected behaviour
- `PortfolioView` fetches from the existing `GET /api/ledger/records` endpoint.
- Filters records of `type === "artifact"` and renders each as an artifact card
  showing: title (from payload), mission reference, and the ISO date saved.
- When the ledger flag is off: show a notice "Save an artifact in Studio to
  build your portfolio."
- When the ledger is empty: show an empty state with a link to `/app/studio`.
- No crash when the API is unreachable (show a loading/error notice).

## Files to modify
| File | Action |
|------|--------|
| `components/portfolio/PortfolioView.tsx` | MODIFY — fetch from `/api/ledger/records`, render artifact cards |

## Acceptance criteria
- [ ] Portfolio fetches `GET /api/ledger/records` on mount
- [ ] Artifact records rendered as cards with content preview (truncated to 120 chars)
- [ ] Empty state rendered when no artifact records exist
- [ ] Error state rendered if fetch fails
- [ ] `npm run lint && npm run typecheck` pass

## File budget
≤ 2 files changed

## Rollback
Revert `PortfolioView.tsx` to previous static state.
