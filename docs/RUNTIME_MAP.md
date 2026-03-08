# Runtime Map — RWFW-LOS

## Entrypoints

| Entrypoint | Type | Description |
|-----------|------|-------------|
| `app/` | Next.js App Router | Main application |
| `scripts/` | Node.js scripts | Verification and ops |

## Environment Variables (detected from package.json)

| Variable | Required | Purpose |
|----------|---------|----------|
| CLERK_SECRET_KEY | Yes | Clerk server auth |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Yes | Clerk client auth |
| AWS_ACCESS_KEY_ID | Yes | AWS credentials |
| AWS_SECRET_ACCESS_KEY | Yes | AWS credentials |
| AWS_REGION | Yes | AWS region |
| GOOGLE_API_KEY | Yes | Gemini AI |
| TODO | | Full list requires reading scripts/verify-env.mjs |

## Commands

```bash
npm run dev          # port 3000
npm run build        # with build lock
npm run typecheck
npm run lint
npm run verify:env
npm run verify:health-check
npm run verify:release-gate
```

---

*Part of: SAHearn1/rwfw-agent-governance ecosystem*
