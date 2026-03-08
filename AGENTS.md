# AGENTS.md — RWFW-LOS
**RWFW Official Learning System**
**Governance Hub:** [SAHearn1/rwfw-agent-governance](https://github.com/SAHearn1/rwfw-agent-governance)

---

## Repo Context

This is the official RWFW Learning System — Next.js 15 app with AWS infrastructure (DynamoDB, SQS, EventBridge, Bedrock), Clerk auth, and Google Gemini AI. It has an extensive verification script suite.

## Operating Rules

All agents must follow the [RWFW AGENTS.md standard](https://github.com/SAHearn1/rwfw-agent-governance/blob/main/AGENTS.md).

Key rules for this repo:
1. **Read before acting.** Never modify source you have not read.
2. **Identify the first failing boundary** before any fix.
3. **Smallest viable fix.** Do not touch adjacent code or refactor.
4. **Verify before complete.** Run `npm run lint`, `npm run typecheck`, then the relevant `verify:*` script.
5. **Governance-only scope.** Write only to `/docs/`, `/.github/`, `/AGENTS.md`, `/repo.intelligence.yml`, root markdown.
6. **Do NOT modify verify scripts.** These are production verification gates.

## Stack Quick Reference

- Framework: Next.js 15 + React 19
- Auth: Clerk
- Database: AWS DynamoDB
- Queue: AWS SQS
- Events: AWS EventBridge
- AI: Google Gemini (@google/genai) + AWS Bedrock
- Package manager: npm

## Common Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (with build lock)
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run verify:env   # Verify environment variables
npm run verify:health-check  # Health check
```

---

*Governed by: [SAHearn1/rwfw-agent-governance](https://github.com/SAHearn1/rwfw-agent-governance)*
