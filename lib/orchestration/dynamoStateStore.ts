import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import { readAwsCredentials, readAwsRegion } from "@/lib/cloud/awsEnv";

import type { OrchestrationJobEnvelope } from "./contracts";

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
}
