# RWFW LOS Program Status

Last Updated: 2026-02-27 (Fourth pass)
Owner: Release Captain (Codex)

## Executive Status
- Front Door + Shell: **Green** ✅
- Role/Auth + RBAC + 403: **Green** ✅
- Multi-role E2E smoke: **Green** ✅
- CI baseline gates (lint + typecheck + build): **Green** ✅
- Release gate (verify:release-gate): **Green** ✅ (all 14 checks pass)
- Sign-in/sign-up graceful degradation: **Green** ✅
- Cloud orchestration (AWS/SQS/DynamoDB): **Green** ✅
- Local private model path (Ollama HTTP): **Green** ✅
- Cloud managed inference (AWS EventBridge): **Green** ✅
- LLM model router API endpoint: **Green** ✅
- Orchestration worker-run endpoint: **Green** ✅
- DB ledger adapter + API route: **Green** ✅
- Admin data retention API: **Green** ✅ *(new — GAP-27 closed)*
- Agent federation control plane: **Green** ✅
- MCP health endpoint: **Green** ✅ *(graceful 503 when disabled)*
- Offline status endpoint: **Green** ✅ *(graceful 503 when disabled)*
- Standards admin UI: **Green** ✅ *(StandardsRegistry shows real data)*
- Teacher/Admin tour steps: **Green** ✅ *(5 role-specific steps each)*
- Observability and SRE controls: **Green** ✅

## Completed Gap Closures (Full History)
- **GAP-01/02**: TeacherHome + AdminHome dashboards ✅
- **GAP-03–10**: All placeholder screens wired ✅
- **GAP-11**: DB ledger adapter + `/api/ledger/records` route ✅
- **GAP-12**: Dead code removed from catch-all ✅
- **GAP-13**: MCP health endpoint with graceful degradation ✅
- **GAP-14**: Offline status endpoint with graceful degradation ✅
- **GAP-16**: Teacher/admin tour steps expanded (5 role-specific steps) ✅
- **GAP-18**: Lint clean — zero warnings ✅
- **GAP-20**: role-matrix.md complete (21 routes + super_admin) ✅
- **GAP-21**: Sign-out button in AppShell ✅
- **GAP-22 (LLM router)**: `/api/inference/route.ts` wires ModelRouter ✅
- **GAP-22/23 (SQS+DynamoDB)**: `/api/orchestration/worker-run` wired ✅
- **GAP-24**: Audit log serverless-safe ✅
- **GAP-25**: Clerk webhook handler processes and syncs metadata ✅
- **GAP-26**: Standards plugin wired in StudioWorkspace ✅
- **GAP-27**: Admin retention API `/api/admin/retention` wired ✅ *(new)*
- **GAP-28**: StandardsRegistry component shows real DEFAULT_STANDARDS ✅
- **GAP-29**: Federation dispatch + registry + discovery wired ✅
- **Sign-in/Sign-up 500**: Graceful "Auth Unavailable" degradation ✅

## Remaining Open Gaps (Low Priority Only)

| Gap | Description | Priority |
|-----|-------------|----------|
| GAP-15 | Landing page CTA differentiation | Low — needs product decision |
| GAP-17 | student_enrolled org check | Low — pending product decision |

## Program Epics
- `#104` Phase 4 Runtime Realization — **COMPLETE**
- Phase 5 Data Governance — **COMPLETE** (GAP-27 retention API, GAP-28 standards UI)
- Phase 6 (planned): UX Polish (GAP-15, GAP-17 when product decisions made)

## Guardrail Enforcement
- One PR per issue, <= 15 files unless approved.
- No parallel PRs editing the same layout file.
- Contract-first for shared APIs and feature flags.
- Every PR must pass lint + build + verify:release-gate.
