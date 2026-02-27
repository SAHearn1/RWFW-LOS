# Operations Runbook

## Incident Triage
1. Confirm failing surface:
- auth/session issue
- route protection issue
- runtime/ledger consistency issue
- onboarding selector issue
- cloud/local parity issue
- federation or webhook signature issue

2. Run local verification bundle:
- `npm run verify:release-gate`
- or granular checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run verify:env`
  - `npm run verify:env-parity`
  - `npm run verify:engine-smoke`
  - `npm run verify:webhook-contract`
  - `npm run verify:branch-policy`
  - `npm run verify:swarm-overlap`
  - `npm run verify:role-routes`
  - `npm run verify:runtime-routes`
  - `npm run verify:onboarding`
  - `npm run verify:http-smoke`

3. Scope impact by role:
- student_independent
- student_enrolled
- adult_learner
- teacher
- professional_development
- admin

## Known Failure Mode: Malformed Clerk Publishable Key
- Symptom: global HTTP 500 on all routes during runtime.
- Root cause: auth middleware initializes Clerk with invalid publishable key.
- Mitigation in code:
  - `middleware.ts` bypasses Clerk and fails safe for protected routes when key is invalid.
  - sign-in/sign-up routes show controlled unavailable state instead of crashing.
- Regression prevention:
  - `npm run verify:env`
  - `npm run verify:http-smoke` in CI.

## Clerk Key Normalization Protocol
- Never wrap Clerk keys in single or double quotes in Vercel project env vars.
- Remove accidental whitespace/newlines when rotating keys.
- Re-sync local env after Vercel updates and re-run:
  - `npm run verify:env`
  - `npm run verify:http-smoke`

## Cloud + Local Parity Protocol
- Keep `.env.example` as the canonical contract for AWS + Ollama + federation keys.
- Validate parity with:
  - `npm run verify:env-parity`
- If local Ollama is enabled (`NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA=true`), both `OLLAMA_BASE_URL` and `OLLAMA_MODEL` must be present.
- If federation is enabled (`NEXT_PUBLIC_ENABLE_FEDERATION=true`), `FEDERATION_GATEWAY_SHARED_SECRET` must be set.
- Partial AWS config is treated as invalid; all orchestration keys must be set together.

## Rollback Decision Tree
- If auth fallback/regression: revert latest auth/layout commit and redeploy.
- If route contract mismatch: restore `lib/auth/routeAccess.ts` from last green commit.
- If runtime/ledger issue: disable `NEXT_PUBLIC_ENABLE_RUNTIME` and/or `NEXT_PUBLIC_ENABLE_LEDGER`.
- If verifier/onboarding issue: disable feature flag and revert offending selector updates.
- If cloud/local parity issue: disable `NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA` and `NEXT_PUBLIC_ENABLE_FEDERATION` until keys are corrected.
- If webhook verification issue: disable webhook endpoint route and rotate `CLERK_WEBHOOK_SECRET`.

## Recovery Steps
1. Apply containment flag changes.
2. Redeploy preview and validate role matrix routes.
3. Promote to production only after all verifiers pass.

## Ownership Rules
- No parallel PRs may edit same layout file.
- Shared contracts must merge before dependent changes.
- Keep PR file count <= 15 unless explicitly approved.


## Backup and Restore Reference
- See docs/runbooks/hybrid-backup-restore.md for step-by-step hybrid backup/restore.


## Vercel Incident Timeline (2026-02-25)
- Window observed: approximately 10-12 hours before stabilization checks.
- Impact pattern: a cluster of production deploys reported `Error` status.
- Current state: latest production deploys returned to `Ready` status.
- Containment used: release-gate verification plus env/auth contract checks before redeploy.
- Prevention:
  - avoid parallel build jobs on the same worktree,
  - run `npm run verify:release-gate` before production promotion,
  - treat env key formatting drift as a release blocker.

## Incident Annotation Workflow
- Open `.github/ISSUE_TEMPLATE/INCIDENT_ANNOTATION.md` for every failed deploy incident.
- Follow `docs/status/INCIDENT_ANNOTATION_WORKFLOW.md` and attach release-gate + deployment evidence.
- Do not close incident tickets until latest deployment is `Ready` and corrective action is tracked.

## AWS Credential Strategy

### Recommended: IAM Role via OIDC (Vercel + GitHub Actions)
Prefer OIDC-federated IAM roles over static long-lived access keys wherever possible.

**Vercel production:**
- Use Vercel's native AWS integration with OIDC to assume an IAM role.
- Required IAM permissions: `bedrock:InvokeModel`, `sqs:SendMessage`, `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`, `events:PutEvents`.
- Configure `AWS_REGION` in Vercel env vars; credentials are auto-injected by the OIDC provider.
- Do NOT store `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` as static Vercel env vars when OIDC is available.

**GitHub Actions CI:**
- Use `aws-actions/configure-aws-credentials` with OIDC role assumption (no static keys in secrets).
- If static keys are required as fallback: rotate every 90 days, alert on expiry via AWS IAM credential report.
- `AWS_SESSION_TOKEN` is ONLY for temporary/local assumed-role sessions — never set it in Vercel production or long-lived CI secrets.

### Static Key Fallback (Current State — Transition Target)
The repo currently uses static `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` stored in Vercel env vars and GitHub secrets. These are acceptable until OIDC is set up.

**Rotation SOP (every 90 days or on suspected compromise):**
1. Create new IAM access key for the service account in AWS Console.
2. Update Vercel env vars: `vercel env add AWS_ACCESS_KEY_ID production` and `AWS_SECRET_ACCESS_KEY`.
3. Update GitHub secrets: `gh secret set AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
4. Run `npm run verify:env-parity` locally to confirm parity.
5. Trigger a Vercel redeployment and run `npm run verify:cloud-aws-smoke` against the new deploy.
6. Deactivate the old IAM key in AWS Console (wait 24h before deleting to allow in-flight requests to complete).
7. Update `docs/status/aws-credential-rotation-log.md` with rotation date and operator.

**Expiry monitoring:**
- Set a calendar reminder for the next rotation date.
- Enable AWS IAM credential report alerts for keys older than 80 days.
- If `AWS_SESSION_TOKEN` is set and expired: immediately clear it from Vercel and GitHub secrets — session tokens are temporary and must never persist.

### Incident: AWS Credentials Expired or Invalid
**Symptoms:**
- `/api/inference` returns `usedFallback: true` with `cloud_inference_failed` message
- `/api/orchestration/worker-run` returns backend: `{ queue: "in_memory", stateStore: "none" }`
- `npm run verify:cloud-aws-smoke` fails with AWS auth error

**Immediate mitigation:**
1. Set `MODEL_ROUTING_POLICY=local_only` in Vercel env vars → disables cloud inference, forces local Ollama fallback.
2. Set `ALLOW_AWS_WORKER_FALLBACK=true` → worker-run falls back to in-memory queue.
3. Redeploy. Application remains functional in local-only mode.

**Recovery:**
1. Rotate credentials per Rotation SOP above.
2. Remove `MODEL_ROUTING_POLICY=local_only` and `ALLOW_AWS_WORKER_FALLBACK=true` after new credentials verified.
3. Document incident in `docs/status/aws-credential-rotation-log.md`.
