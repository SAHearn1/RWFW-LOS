# AWS Credential Strategy — RWFW-LOS

## Overview
This document defines the credential architecture for AWS services used by RWFW-LOS:
- **Bedrock** — cloud LLM inference (`CloudManagedProvider`)
- **SQS** — orchestration job queue (`SqsQueueAdapter`)
- **DynamoDB** — orchestration state store (`DynamoOrchestrationStateStore`)
- **EventBridge** — observability/audit event bus

## Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInference",
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    },
    {
      "Sid": "SQSOrchestration",
      "Effect": "Allow",
      "Action": ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
      "Resource": "<AWS_SQS_QUEUE_URL_ARN>"
    },
    {
      "Sid": "DynamoState",
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:*:*:table/<AWS_DYNAMODB_ORCHESTRATION_TABLE>"
    },
    {
      "Sid": "EventBridgeObservability",
      "Effect": "Allow",
      "Action": ["events:PutEvents"],
      "Resource": "arn:aws:events:*:*:event-bus/<AWS_EVENTBRIDGE_BUS_NAME>"
    }
  ]
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_REGION` | Yes | AWS region (e.g., `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | Static fallback | IAM access key ID |
| `AWS_SECRET_ACCESS_KEY` | Static fallback | IAM secret access key |
| `AWS_SESSION_TOKEN` | Temporary only | Assumed-role session token — never persist in Vercel/CI |
| `BEDROCK_MODEL_ID` | Yes | Bedrock model ID (default: `amazon.titan-text-express-v1`) |
| `AWS_SQS_QUEUE_URL` | Yes | Primary SQS queue URL |
| `AWS_SQS_DLQ_URL` | Yes | Dead-letter queue URL |
| `AWS_DYNAMODB_ORCHESTRATION_TABLE` | Yes | DynamoDB table name |
| `AWS_EVENTBRIDGE_BUS_NAME` | Yes | EventBridge bus name |

## Rotation Schedule
- Rotate static keys every **90 days**.
- See `docs/operations-runbook.md` → AWS Credential Strategy → Rotation SOP for step-by-step procedure.

## Fallback Posture
When AWS credentials are invalid or unavailable:
- Set `MODEL_ROUTING_POLICY=local_only` → routes inference to local Ollama
- Set `ALLOW_AWS_WORKER_FALLBACK=true` → worker-run uses in-memory queue
- Application remains functional; no downtime required for credential rotation
