# Integration Points — RWFW-LOS

## External Services

| Service | Purpose | Auth Method | Failure Impact |
|---------|---------|------------|----------------|
| Clerk | Authentication | Secret key + publishable key | Full auth failure |
| AWS DynamoDB | Primary data store | IAM credentials | Data unavailable |
| AWS SQS | Message queue | IAM credentials | Async processing fails |
| AWS EventBridge | Event routing | IAM credentials | Event-driven flows fail |
| AWS Bedrock | AI inference | IAM credentials | AI features fail |
| Google Gemini | AI generation | API key | AI features fail |

---

*Part of: SAHearn1/rwfw-agent-governance ecosystem*
