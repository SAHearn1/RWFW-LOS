# Architecture Map — RWFW-LOS

> Scaffold from package.json Phase A read. Deep read of app/ and scripts/ deferred to Phase C.

## System Overview

RWFW Official Learning System — Next.js 15 full-stack application with AWS infrastructure backbone, Clerk authentication, and Google Gemini + AWS Bedrock AI integration.

## Layer Diagram

```
[Learner / Admin]
      ↓
[Next.js 15 App Router]     app/ directory
  ├─ UI: React 19 + Tailwind CSS + Lucide
  └─ Routing: Next.js App Router
      ↓
[API Layer]                 app/api/ routes
      ↓
[Auth Layer]                Clerk middleware
  └─ @clerk/nextjs
      ↓
[Service Layer]             TODO — Phase C deep read
      ↓
[Data Layer]
  ├─ AWS DynamoDB (primary data store)
  ├─ AWS SQS (message queue)
  ├─ AWS EventBridge (event routing)
  └─ AWS Bedrock (AI inference)
      ↓
[External AI]
  └─ Google Gemini (@google/genai)
```

## Verification Gates

This repo has production verification scripts at `scripts/verify-*.mjs`. These are critical infrastructure — do not modify them.

---

*Part of: SAHearn1/rwfw-agent-governance ecosystem*
