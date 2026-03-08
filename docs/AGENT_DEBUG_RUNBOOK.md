# Agent Debug Runbook — RWFW-LOS

Extends the [RWFW ecosystem runbook](https://github.com/SAHearn1/rwfw-agent-governance/blob/main/docs/AGENT_DEBUG_RUNBOOK.md).

## Stack-Specific Debugging

### Clerk Auth Issues
- Check `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` env vars
- Verify middleware.ts is correctly protecting routes
- Check Clerk dashboard for user/session status

### AWS Issues
- Check AWS credential env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)
- DynamoDB: check table name, region, and IAM permissions
- SQS: check queue URL and message format
- EventBridge: check event bus name and rule matching
- Run `npm run verify:cloud-aws-smoke` for AWS connectivity check

### Gemini / Bedrock AI Issues
- Check `GOOGLE_API_KEY` or Bedrock credential configuration
- Verify model ID and region for Bedrock
- Check rate limits and quota

### Build Issues
- Run `npm run typecheck` first — TypeScript errors surface as build failures
- Build uses a lock script (`scripts/with-build-lock.mjs`) — check for stale locks
- Run `npm run verify:release-gate` before production deploys

### Verification Scripts
This repo has extensive verify scripts. Run the relevant one first:
```bash
npm run verify:env              # Environment variables
npm run verify:health-check     # Service health
npm run verify:api-auth-guards  # API authentication
npm run verify:runtime-routes   # Route configuration
```

---

*Part of: SAHearn1/rwfw-agent-governance ecosystem*
