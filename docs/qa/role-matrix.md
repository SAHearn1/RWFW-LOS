# Role QA Matrix

**Last Updated:** 2026-02-28

| Route | student_independent | student_enrolled | adult_learner | teacher | professional_development | admin | super_admin | Implementation Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/app` | allow | allow | allow | allow | allow | allow | allow | functional | Shared shell home with role-specific dashboards |
| `/app/profile` | allow | allow | allow | allow | allow | allow | allow | functional | Shared profile route |
| `/app/core` | allow | allow | allow | allow | allow | allow | allow | functional | Flag-gated bridge runtime; ALL_ROLES per routeAccess.ts |
| `/app/missions` | allow | allow | allow | deny | deny | deny | deny | placeholder | Learner mission flow; renders MissionsList component |
| `/app/studio` | allow | allow | allow | deny | deny | deny | deny | placeholder | Artifact creation workspace; renders StudioWorkspace component |
| `/app/portfolio` | allow | allow | allow | deny | deny | deny | deny | functional | Learner portfolio view; ledger-bound artifact gallery with verification verdicts |
| `/app/credentials` | allow | allow | allow | deny | deny | deny | deny | wired | Renders CredentialsSummary; ledger-read wired |
| `/app/settings` | allow | allow | allow | deny | deny | deny | deny | wired | Learner settings health; AI/MCP/flag status checks wired |
| `/app/command-center` | deny | deny | deny | allow | allow | deny | deny | functional | Live stats from ledger (activeCohorts, pickupQueue, reviewBacklog); fully wired |
| `/app/cohorts` | deny | deny | deny | allow | allow | deny | deny | functional | Ledger-derived cohort list with learner counts; empty state shown until missions exist |
| `/app/reviews` | deny | deny | deny | allow | allow | deny | deny | functional | Ledger-read ReviewQueue; Approve/Return/Flag actions wired |
| `/app/pickups` | deny | deny | deny | allow | allow | deny | deny | wired | Feature-flag gated (NEXT_PUBLIC_ENABLE_PICKUP); ledger-read queues when enabled |
| `/app/builder` | deny | deny | deny | allow | allow | deny | deny | functional | Mission + cohort creation persisted to local ledger |
| `/app/evidence` | deny | deny | deny | deny | deny | allow | deny | functional | Reads local or DB ledger records; DB path behind phase3 flag |
| `/app/exports` | deny | deny | deny | deny | deny | allow | deny | functional | JSON + CSV download; KPI snapshot from local ledger + runtime state |
| `/app/standards` | deny | deny | deny | deny | deny | allow | deny | functional | CRUD via StandardsManager (admin/super_admin path); StandardsRegistry for read-only |
| `/app/super-admin` | deny | deny | deny | deny | deny | deny | allow | functional | Super Admin shell; routes to /users, /teachers, /licenses, /institutions |
| `/app/super-admin/users` | deny | deny | deny | deny | deny | deny | allow | functional | Super Admin user roster |
| `/app/super-admin/teachers` | deny | deny | deny | deny | deny | deny | allow | functional | Super Admin teacher role assignment |
| `/app/super-admin/licenses` | deny | deny | deny | deny | deny | deny | allow | functional | Super Admin license and trial management |
| `/app/super-admin/institutions` | deny | deny | deny | deny | deny | deny | allow | functional | Super Admin institution account management |
| `/app/retention` | deny | deny | deny | deny | deny | allow | allow | functional | Admin data lifecycle and GDPR retention management; requires DB ledger |
| `/app/super-admin/audit-log` | deny | deny | deny | deny | deny | deny | allow | functional | Super Admin audit event browser; reads docs/status/audit-log.ndjson |
| `/app/forbidden` | allow | allow | allow | allow | allow | allow | allow | functional | In-app 403 route |

## Implementation Status Key

- **functional** — Component renders real data; core interactions wired end-to-end
- **wired** — Component renders and connects to data sources/flags but depends on external conditions (feature flags, env vars, DB) for full behavior
- **placeholder** — Route is protected and renders the correct component shell; full learner-facing UI deferred to Phase 2

## Determinism Rules

- All decisions are contract-driven from `lib/auth/routeAccess.ts`.
- Any role/route change must update this matrix and verifier scripts together.
- CI blocks merge when required route contracts are missing.

## Authority Boundaries

- `super_admin` is the **sole authority** for granting and revoking the `teacher` role.
- `super_admin` can create trial, institutional, and enterprise license tenants.
- `super_admin` can delegate a `localAdminUserId` per institution for scoped account management.
- Regular `admin` has no access to super-admin routes — these are strictly separated.

## Notes

- `/app/settings` is defined as LEARNER_ROLES in `routeAccess.ts`; the SettingsHealth component provides AI/MCP/flag diagnostics for learners only in the current contract.
- `/app/cohorts` and `/app/reviews` will show empty state until learners create missions in Studio (data is ledger-derived).
- `/app/pickups` requires `NEXT_PUBLIC_ENABLE_PICKUP=true` env var for the full queue UI to render.
- `/app/evidence` DB path requires `NEXT_PUBLIC_USE_DB_LEDGER=true` and a deployed SQLite DB.
