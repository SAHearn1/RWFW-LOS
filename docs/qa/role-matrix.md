# Role QA Matrix

| Route | student_independent | student_enrolled | adult_learner | teacher | professional_development | admin | super_admin | Notes |
|---|---|---|---|---|---|---|---|---|
| `/app` | allow | allow | allow | allow | allow | allow | allow | Shared shell home with role-specific dashboards |
| `/app/profile` | allow | allow | allow | allow | allow | allow | allow | Shared profile route |
| `/app/core` | allow | allow | allow | allow | allow | allow | allow | Flag-gated bridge runtime |
| `/app/missions` | allow | allow | allow | deny | deny | deny | deny | Learner mission flow |
| `/app/studio` | allow | allow | allow | deny | deny | deny | deny | Learner studio workspace |
| `/app/portfolio` | allow | allow | allow | deny | deny | deny | deny | Learner portfolio view |
| `/app/credentials` | allow | allow | allow | deny | deny | deny | deny | Learner evidence summary |
| `/app/settings` | allow | allow | allow | deny | deny | deny | deny | Learner settings health |
| `/app/command-center` | deny | deny | deny | allow | allow | deny | deny | Facilitator operations |
| `/app/cohorts` | deny | deny | deny | allow | allow | deny | deny | Facilitator cohort management |
| `/app/pickups` | deny | deny | deny | allow | allow | deny | deny | Facilitator pickups queue |
| `/app/reviews` | deny | deny | deny | allow | allow | deny | deny | Facilitator review queue |
| `/app/builder` | deny | deny | deny | allow | allow | deny | deny | Facilitator builder workspace |
| `/app/standards` | deny | deny | deny | deny | deny | allow | deny | Admin standards workspace |
| `/app/evidence` | deny | deny | deny | deny | deny | allow | deny | Admin evidence read view |
| `/app/exports` | deny | deny | deny | deny | deny | allow | deny | Admin export readiness |
| `/app/super-admin/users` | deny | deny | deny | deny | deny | deny | allow | Super Admin user roster |
| `/app/super-admin/teachers` | deny | deny | deny | deny | deny | deny | allow | Super Admin teacher assignment |
| `/app/super-admin/licenses` | deny | deny | deny | deny | deny | deny | allow | Super Admin license manager |
| `/app/super-admin/institutions` | deny | deny | deny | deny | deny | deny | allow | Super Admin institution accounts |
| `/app/forbidden` | allow | allow | allow | allow | allow | allow | allow | In-app 403 route |

## Determinism Rules
- All decisions are contract-driven from `lib/auth/routeAccess.ts`.
- Any role/route change must update this matrix and verifier scripts together.
- CI blocks merge when required route contracts are missing.

## Authority Boundaries
- `super_admin` is the **sole authority** for granting and revoking the `teacher` role.
- `super_admin` can create trial, institutional, and enterprise license tenants.
- `super_admin` can delegate a `localAdminUserId` per institution for scoped account management.
- Regular `admin` has no access to super-admin routes — these are strictly separated.
