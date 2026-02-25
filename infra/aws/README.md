# AWS Baseline Orchestration Placeholder

This folder is a deterministic placeholder for Phase 4 orchestration infrastructure.

## Contracted Resources
- queue: primary orchestration queue (`AWS_SQS_QUEUE_URL`)
- queue_dlq: dead-letter queue (`AWS_SQS_DLQ_URL`)
- state_store: orchestration state table (`AWS_DYNAMODB_ORCHESTRATION_TABLE`)
- event_bus: orchestration events bus (`AWS_EVENTBRIDGE_BUS_NAME`)

## Guardrails
- Do not provision production resources from this placeholder directly.
- Add environment-specific IaC modules in follow-up tickets.
- Keep resource naming explicit and non-magical.
