# Role QA Matrix

| Route | student_independent | student_enrolled | adult_learner | teacher | professional_development | admin | Notes |
|---|---|---|---|---|---|---|---|
| `/app` | allow | allow | allow | allow | allow | allow | Shared shell home with role-specific dashboards |
| `/app/studio` | allow | allow | allow | deny | deny | deny | Learner workspace |
| `/app/missions` | allow | allow | allow | deny | deny | deny | Learner mission flow |
| `/app/credentials` | allow | allow | allow | deny | deny | deny | Learner evidence summary |
| `/app/settings` | allow | allow | allow | deny | deny | deny | Learner settings health |
| `/app/command-center` | deny | deny | deny | allow | allow | deny | Facilitator operations |
| `/app/cohorts` | deny | deny | deny | allow | allow | deny | Facilitator operations |
| `/app/reviews` | deny | deny | deny | allow | allow | deny | Facilitator operations |
| `/app/evidence` | deny | deny | deny | deny | deny | allow | Admin evidence view |
| `/app/exports` | deny | deny | deny | deny | deny | allow | Admin export readiness |
| `/app/profile` | allow | allow | allow | allow | allow | allow | Shared profile route |
| `/app/core` | allow | allow | allow | allow | allow | allow | Flag-gated bridge |

## Determinism Rules
- All decisions are contract-driven from `lib/auth/routeAccess.ts`.
- Any role/route change must update this matrix and verifier scripts together.
- CI blocks merge when required route contracts are missing.