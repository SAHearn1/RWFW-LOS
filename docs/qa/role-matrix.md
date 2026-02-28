# Role QA Matrix

**Last Updated:** 2026-02-28 (Ninth pass — API route auth matrix added)

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

---

## API Route Auth Matrix

All API routes under `app/api/` are documented below. Auth mechanism is one of:
- **Session + Role** — requires valid Clerk session AND specific role(s)
- **Session** — requires valid Clerk session, any role
- **Unauthenticated** — publicly accessible (no auth required)
- **HMAC** — verified via webhook signature (no Clerk session)
- **Bearer Token** — verified via `timingSafeEqual` against `ROOTWORK_TELEMETRY_INGEST_TOKEN`

**Column key:** si=student_independent, se=student_enrolled, al=adult_learner, tc=teacher,
pd=professional_development, ad=admin, sa=super_admin

| Endpoint | Method | Auth Mechanism | si | se | al | tc | pd | ad | sa | Notes |
|----------|--------|---------------|----|----|----|----|----|----|----|----|
| `GET /api/health` | GET | Unauthenticated | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Detail redacted for non-admin callers |
| `GET /api/ai/health` | GET | Unauthenticated | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SQS/DynamoDB/Clerk/Bedrock checks |
| `POST /api/inference` | POST | Session + Role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Any valid role; rate-limited |
| `GET /api/ledger/records` | GET | Session + Role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Learners: own records only; facilitators: by learnerId param; admin: all |
| `POST /api/ledger/records` | POST | Session + Role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Learners write own records; facilitators/admin can write any |
| `GET /api/timeline/learner` | GET | Session + Role | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Learner roles only |
| `GET /api/runtime/state` | GET | Session + Role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Learners: own state; facilitators/admin: by learnerId param |
| `PUT /api/runtime/state` | PUT | Session + Role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Write own state; facilitators/admin can write any |
| `GET /api/standards/config` | GET | Session + Role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Any valid role — read access |
| `POST /api/standards/config` | POST | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Write access: admin + super_admin only |
| `POST /api/admin/retention` | POST | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Data purge/deletion; audited |
| `GET /api/federation` | GET | Session | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Discovery — any authenticated session |
| `POST /api/federation` | POST | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Dispatch — admin/super_admin only; flag-gated |
| `POST /api/orchestration/worker-run` | POST | Session + Role | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | Facilitators + admin/super_admin |
| `GET /api/profile/update` | GET | Session | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Own profile only |
| `POST /api/profile/update` | POST | Session | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Own profile only |
| `GET /api/licensing/assignments` | GET | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | admin + super_admin |
| `POST /api/licensing/assignments` | POST | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | admin + super_admin |
| `DELETE /api/licensing/assignments` | DELETE | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | admin + super_admin |
| `GET /api/licensing/tenants` | GET | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | super_admin only |
| `POST /api/licensing/tenants` | POST | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | super_admin only |
| `DELETE /api/licensing/tenants` | DELETE | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | super_admin only |
| `GET /api/super-admin/users` | GET | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Live Clerk user list |
| `POST /api/super-admin/assign-role` | POST | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Role assignment; audited |
| `GET /api/super-admin/audit-log` | GET | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Audit log browser |
| `GET /api/support/diagnostics` | GET | Session + Role | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Flag + env diagnostics bundle |
| `POST /api/telemetry/pilot` | POST | Bearer Token | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `ROOTWORK_TELEMETRY_INGEST_TOKEN` gated (allow-all in dev when unset) |
| `POST /api/webhooks/clerk` | POST | HMAC | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Clerk-signed webhook; signature verified |
| `GET /api/mcp/health` | GET | Unauthenticated | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Returns 503 when flag disabled |
| `GET /api/offline/status` | GET | Unauthenticated | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Returns 503 when flag disabled |

### API Auth Contract Rules

1. Every endpoint requiring auth MUST call `currentUser()` from `@clerk/nextjs/server`
2. Every endpoint with role restrictions MUST call `parseAppRole(user.publicMetadata.role)`
3. Role checks MUST use constants from `lib/auth/routeAccess.ts` (not inline role strings)
4. All responses MUST include `x-rootwork-trace-id` header
5. All mutating endpoints MUST call `enforceRateLimit()` before processing
6. Bearer token comparisons MUST use `timingSafeEqual()` (not `===`)
7. External `fetch()` calls (Clerk API, AWS) MUST be wrapped in try-catch → 502 response
8. Webhook handlers MUST use HMAC verification, not Clerk session auth
