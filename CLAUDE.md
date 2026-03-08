# CLAUDE.md — RWFW-LOS

> Agent briefing document. Read this before touching any code.
> Governance hub: `SAHearn1/rwfw-agent-governance`

## Repo Identity

- **Purpose:** RootWork Framework Learning Operating System — core LMS platform
- **Tier:** 1 (production-critical)
- **Criticality:** HIGH — primary learning delivery system

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Auth | Clerk |
| Database | AWS DynamoDB |
| AI | Google Gemini SDK |
| Messaging | AWS SQS + EventBridge |
| AI Runtime | AWS Bedrock |
| Deployment | Vercel / AWS |

## Before You Write Any Code

1. Read `repo.intelligence.yml` — authoritative stack profile
2. Read `docs/ARCHITECTURE_MAP.md` — service map
3. Read `docs/RUNTIME_MAP.md` — env vars, AWS config
4. Check `docs/INCIDENTS.md` — known active issues

## Critical Rules for This Repo

- **Next.js App Router conventions.** `page.tsx` files are Server Components by default. Add `'use client'` only when needed. Do not add client-side state to Server Components.
- **Clerk auth is the gate.** Use `auth()` from `@clerk/nextjs/server` in Server Components. Use `useAuth()` only in Client Components.
- **AWS SDK calls are async and can fail.** Always handle DynamoDB errors explicitly. Never assume writes succeed without checking the response.
- **EventBridge events are fire-and-forget.** If delivery matters, implement DLQ handling.
- **Gemini API has rate limits.** Handle 429 responses. Use exponential backoff.
- **No `git add .`** — stage specific files only.

## Dev Workflow

```bash
npm install
npm run dev          # Next.js dev server
npm run lint
npm run type-check
npm run build
```

## Required Env Vars

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
GEMINI_API_KEY
```

## Debugging

See `docs/AGENT_DEBUG_RUNBOOK.md` for the 6-phase debug protocol.  
See `docs/DEBUG_PLAYBOOK.md` for Clerk/AWS/Gemini failure tables.

## Governance

All agents operating here must follow `AGENTS.md` (8 rules).  
Incidents logged to `docs/INCIDENTS.md`. Fix recipes in `docs/REPAIR_PATTERNS.md`.

## Operating Rules

**If you resolve a bug during this session, you MUST append an entry to `docs/INCIDENTS.md` before the session ends. This is non-negotiable. Session is not complete until the entry is committed.**

See Rule 7 in `AGENTS.md` (governance hub: `SAHearn1/rwfw-agent-governance`) for the full incident logging protocol.
