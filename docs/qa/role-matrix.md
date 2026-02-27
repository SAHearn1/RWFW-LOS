# Role QA Matrix

## Protected Routes (`/app/*`)

| Route | student_independent | student_enrolled | adult_learner | teacher | professional_development | admin | super_admin | Notes |
|---|---|---|---|---|---|---|---|---|
| `/app` | allow | allow | allow | allow | allow | allow | allow | Shared shell home with role-specific dashboards |
| `/app/profile` | allow | allow | allow | allow | allow | allow | allow | Shared profile route |
| `/app/core` | allow | allow | allow | allow | allow | allow | allow | Flag-gated bridge |
| `/app/missions` | allow | allow | allow | deny | deny | deny | deny | Learner mission flow |
| `/app/studio` | allow | allow | allow | deny | deny | deny | deny | Learner workspace |
| `/app/portfolio` | allow | allow | allow | deny | deny | deny | deny | Learner evidence portfolio |
| `/app/credentials` | allow | allow | allow | deny | deny | deny | deny | Learner evidence summary |
| `/app/settings` | allow | allow | allow | deny | deny | deny | deny | Learner settings health |
| `/app/command-center` | deny | deny | deny | allow | allow | deny | deny | Facilitator operations |
| `/app/cohorts` | deny | deny | deny | allow | allow | deny | deny | Facilitator cohort management |
| `/app/pickups` | deny | deny | deny | allow | allow | deny | deny | Facilitator pickups (flag-gated) |
| `/app/reviews` | deny | deny | deny | allow | allow | deny | deny | Facilitator review queue |
| `/app/builder` | deny | deny | deny | allow | allow | deny | deny | Facilitator mission/cohort builder |
| `/app/standards` | deny | deny | deny | deny | deny | allow | deny | Admin standards registry |
| `/app/evidence` | deny | deny | deny | deny | deny | allow | deny | Admin evidence view |
| `/app/exports` | deny | deny | deny | deny | deny | allow | deny | Admin export readiness |
| `/app/forbidden` | allow | allow | allow | allow | allow | allow | allow | In-app 403 view (all roles) |

## Super-Admin Routes (`/app/super-admin/*`)

| Route | student_independent | student_enrolled | adult_learner | teacher | professional_development | admin | super_admin | Notes |
|---|---|---|---|---|---|---|---|---|
| `/app/super-admin/users` | deny | deny | deny | deny | deny | deny | allow | User roster — all platform accounts |
| `/app/super-admin/teachers` | deny | deny | deny | deny | deny | deny | allow | Teacher assignment — sole authority for Teacher role grant |
| `/app/super-admin/licenses` | deny | deny | deny | deny | deny | deny | allow | License manager — trials, institutional, enterprise |
| `/app/super-admin/institutions` | deny | deny | deny | deny | deny | deny | allow | Institution account management |

## Public Routes (no auth required)

| Route | Notes |
|---|---|
| `/` | Landing page — three role CTAs (learner, teacher, admin) |
| `/admin-info` | Admin information page |
| `/sign-in` | Clerk authentication |
| `/sign-up` | Clerk registration |

## Determinism Rules
- All decisions are contract-driven from `lib/auth/routeAccess.ts`.
- Any role/route change must update this matrix and verifier scripts together.
- CI blocks merge when required route contracts are missing.
