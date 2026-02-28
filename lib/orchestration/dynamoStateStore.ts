import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import { readAwsCredentials, readAwsRegion } from "@/lib/cloud/awsEnv";

import type {
  OrchestrationJobEnvelope,
  OrchestrationJobStatus,
  OrchestrationStateTransition
} from "./contracts";

/**
 * DynamoDB-backed orchestration state store.
 *
 * Item schema:
 *   pk = "job#<jobId>"                          — partition key (shared)
 *   sk = "state"                                — current job state record
 *   sk = "transition#<ISO>#<counter>"           — append-only transition history
 *
 * Transition history items share the job partition key, enabling efficient
 * per-job queries via KeyConditionExpression on begins_with(sk, "transition#").
 */
export class DynamoOrchestrationStateStore<TPayload = unknown> {
  private readonly client: DynamoDBDocumentClient;

  constructor(private readonly tableName: string, region = readAwsRegion()) {
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region,
        credentials: readAwsCredentials()
      })
    );
  }

  // ─── Job state ───────────────────────────────────────────────────────────

  async upsert(job: OrchestrationJobEnvelope<TPayload>): Promise<OrchestrationJobEnvelope<TPayload>> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `job#${job.jobId}`,
          sk: "state",
          ...job
        }
      })
    );

    return job;
  }

  async get(jobId: string): Promise<OrchestrationJobEnvelope<TPayload> | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          pk: `job#${jobId}`,
          sk: "state"
        }
      })
    );

    if (!result.Item) {
      return null;
    }

    const { pk, sk, ...job } = result.Item;
    void pk;
    void sk;
    return job as OrchestrationJobEnvelope<TPayload>;
  }

  async list(limit = 25): Promise<OrchestrationJobEnvelope<TPayload>[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "sk = :state",
        ExpressionAttributeValues: {
          ":state": "state"
        },
        Limit: limit,
        IndexName: "sk-index"
      })
    );

    return (result.Items ?? []).map((item) => {
      const { pk, sk, ...job } = item;
      void pk;
      void sk;
      return job as OrchestrationJobEnvelope<TPayload>;
    });
  }

  // ─── State transition history ─────────────────────────────────────────────

  /**
   * Record an append-only state transition for a job.
   *
   * The sort key format "transition#<ISO>#<5-digit-random>" ensures:
   *   1. Chronological ordering via DynamoDB sort
   *   2. No collisions for rapid transitions within the same millisecond
   *
   * @param jobId    - The job being transitioned.
   * @param from     - Status before the transition.
   * @param to       - Status after the transition.
   * @param reason   - Human-readable reason (e.g. "worker_failure", "lease_expired").
   * @param traceId  - Request trace ID for cross-system correlation.
   */
  async recordTransition(
    jobId: string,
    from: OrchestrationJobStatus,
    to: OrchestrationJobStatus,
    reason: string,
    traceId: string
  ): Promise<void> {
    const occurredAtIso = new Date().toISOString();
    const counter = Math.floor(Math.random() * 99_999)
      .toString()
      .padStart(5, "0");

    const transition: OrchestrationStateTransition = { from, to, reason, occurredAtIso };

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `job#${jobId}`,
          sk: `transition#${occurredAtIso}#${counter}`,
          jobId,
          traceId,
          ...transition
        }
      })
    );
  }

  /**
   * Retrieve the full state transition history for a job in chronological order.
   *
   * @param jobId - The job to query.
   * @param limit - Maximum number of transitions to return (default: 100).
   */
  async getTransitionHistory(
    jobId: string,
    limit = 100
  ): Promise<OrchestrationStateTransition[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression:
          "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: {
          ":pk": `job#${jobId}`,
          ":prefix": "transition#"
        },
        Limit: limit,
        ScanIndexForward: true // oldest → newest
      })
    );

    return (result.Items ?? []).map((item) => {
      const { pk, sk, jobId: _jid, traceId: _tid, ...transition } = item;
      void pk;
      void sk;
      void _jid;
      void _tid;
      return transition as OrchestrationStateTransition;
    });
  }
}
