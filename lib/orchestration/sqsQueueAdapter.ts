import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from "@aws-sdk/client-sqs";

import { readAwsCredentials, readAwsRegion } from "@/lib/cloud/awsEnv";

import type { OrchestrationJobEnvelope, QueueLeaseRequest, QueueLeaseResult } from "./contracts";

export class SqsQueueAdapter<TPayload = unknown> {
  private readonly client: SQSClient;

  constructor(private readonly queueUrl: string, region = readAwsRegion()) {
    this.client = new SQSClient({
      region,
      credentials: readAwsCredentials()
    });
  }

  async enqueue(job: OrchestrationJobEnvelope<TPayload>): Promise<OrchestrationJobEnvelope<TPayload>> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(job),
        MessageDeduplicationId: job.idempotencyKey,
        MessageGroupId: "rootwork-orchestration"
      })
    );

    return job;
  }

  async leaseNext(request: QueueLeaseRequest): Promise<QueueLeaseResult<TPayload>> {
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
        VisibilityTimeout: Math.max(1, Math.floor(request.leaseTtlMs / 1000))
      })
    );

    const message = response.Messages?.[0];
    if (!message || !message.Body) {
      return { leased: false, reason: "no queued jobs" };
    }

    const parsed = JSON.parse(message.Body) as OrchestrationJobEnvelope<TPayload>;
    return {
      leased: true,
      job: {
        ...parsed,
        status: "leased",
        updatedAtIso: request.nowIso
      }
    };
  }
}
