# Role QA Matrix

| Route | student_independent | student_enrolled | teacher | admin | Notes |
|---|---|---|---|---|---|
| `/app` | allow | allow | allow | allow | Shared shell home |
| `/app/studio` | allow | allow | deny | deny | Student workspace |
| `/app/missions` | allow | allow | deny | deny | Student-only mission flow |
| `/app/credentials` | allow | allow | deny | deny | Learner evidence summary |
| `/app/settings` | allow | allow | deny | deny | Student settings health |
| `/app/command-center` | deny | deny | allow | deny | Teacher operations |
| `/app/cohorts` | deny | deny | allow | deny | Teacher operations |
| `/app/reviews` | deny | deny | allow | deny | Teacher operations |
| `/app/evidence` | deny | deny | deny | allow | Admin evidence view |
| `/app/exports` | deny | deny | deny | allow | Admin export readiness |
| `/app/profile` | allow | allow | allow | allow | Shared profile route |
| `/app/core` | allow | allow | allow | allow | Flag-gated bridge |

## Determinism Rules
- All decisions are contract-driven from `lib/auth/routeAccess.ts`.
- Any role/route change must update this matrix and verifier scripts together.
- CI blocks merge when required route contracts are missing.
