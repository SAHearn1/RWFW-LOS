# Role QA Matrix

| Route | student_independent | student_enrolled | adult_learner | teacher | professional_development | admin | Notes |
|---|---|---|---|---|---|---|---|
| `/app` | allow | allow | allow | allow | allow | allow | Shared shell home with role-specific dashboards |
| `/app/profile` | allow | allow | allow | allow | allow | allow | Shared profile route |
| `/app/core` | allow | allow | allow | allow | allow | allow | Flag-gated bridge runtime |
| `/app/missions` | allow | allow | allow | deny | deny | deny | Learner mission flow |
| `/app/studio` | allow | allow | allow | deny | deny | deny | Learner studio workspace |
| `/app/portfolio` | allow | allow | allow | deny | deny | deny | Learner portfolio view |
| `/app/credentials` | allow | allow | allow | deny | deny | deny | Learner evidence summary |
| `/app/settings` | allow | allow | allow | deny | deny | deny | Learner settings health |
| `/app/command-center` | deny | deny | deny | allow | allow | deny | Facilitator operations |
| `/app/cohorts` | deny | deny | deny | allow | allow | deny | Facilitator cohort management |
| `/app/pickups` | deny | deny | deny | allow | allow | deny | Facilitator pickups queue |
| `/app/reviews` | deny | deny | deny | allow | allow | deny | Facilitator review queue |
| `/app/builder` | deny | deny | deny | allow | allow | deny | Facilitator builder workspace |
| `/app/standards` | deny | deny | deny | deny | deny | allow | Admin standards workspace |
| `/app/evidence` | deny | deny | deny | deny | deny | allow | Admin evidence read view |
| `/app/exports` | deny | deny | deny | deny | deny | allow | Admin export readiness |
| `/app/forbidden` | allow | allow | allow | allow | allow | allow | In-app 403 route |

## Determinism Rules
- All decisions are contract-driven from `lib/auth/routeAccess.ts`.
- Any role/route change must update this matrix and verifier scripts together.
- CI blocks merge when required route contracts are missing.
