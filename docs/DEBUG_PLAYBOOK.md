# Debug Playbook — RWFW-LOS

| Symptom | Check First | Common Root Cause |
|---------|-------------|-------------------|
| Clerk auth 401 | CLERK_SECRET_KEY env | Missing or wrong Clerk key |
| DynamoDB error | AWS credentials + table name | Wrong region or table name |
| SQS message lost | Queue URL + IAM | Permission or wrong queue URL |
| Bedrock error | AWS region + model ID | Wrong model ID or region |
| Build fails (lock) | `scripts/with-build-lock.mjs` | Stale build lock file |
| Verify script fails | Run individually | Check specific verify output |
| Next.js 15 hydration | Server/client mismatch | Data fetching pattern issue |

---

*See also: [RWFW Debug Playbook](https://github.com/SAHearn1/rwfw-agent-governance/blob/main/docs/DEBUG_PLAYBOOK.md)*
