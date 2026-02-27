import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { NextResponse } from "next/server";

import { readAwsCredentials, readAwsRegion, readSqsQueueUrl, readDynamoTable } from "@/lib/cloud/awsEnv";
import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export const runtime = "nodejs";

type CheckStatus = "ok" | "error" | "unconfigured";

interface CheckResult {
  status: CheckStatus;
  latencyMs?: number;
  detail?: string;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function checkClerk(): Promise<CheckResult> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    return { status: "unconfigured", detail: "CLERK_SECRET_KEY not set" };
  }

  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch("https://api.clerk.com/v1/users?limit=1", {
        headers: { Authorization: `Bearer ${secret}` }
      }),
      3000
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { status: "error", latencyMs, detail: `HTTP ${res.status}` };
    }
    return { status: "ok", latencyMs };
  } catch (err) {
    return { status: "error", latencyMs: Date.now() - start, detail: String(err) };
  }
}

async function checkBedrock(): Promise<CheckResult> {
  const modelId = process.env.BEDROCK_MODEL_ID?.trim() || process.env.AWS_BEDROCK_MODEL_ID?.trim();
  const region = readAwsRegion();
  if (!modelId || !region) {
    return {
      status: "unconfigured",
      detail: `Missing: ${!modelId ? "BEDROCK_MODEL_ID" : ""}${!region ? " AWS_REGION" : ""}`.trim()
    };
  }
  // Config-only check — no API call to avoid cost
  return { status: "ok", detail: `model=${modelId} region=${region}` };
}

async function checkSqs(): Promise<CheckResult> {
  const queueUrl = readSqsQueueUrl();
  const region = readAwsRegion();
  if (!queueUrl || !region) {
    return { status: "unconfigured", detail: "AWS_SQS_QUEUE_URL or AWS_REGION not set" };
  }

  const client = new SQSClient({ region, credentials: readAwsCredentials() });
  const start = Date.now();
  try {
    const result = await withTimeout(
      client.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ["ApproximateNumberOfMessages"]
        })
      ),
      3000
    );
    const latencyMs = Date.now() - start;
    const depth = result.Attributes?.ApproximateNumberOfMessages ?? "unknown";
    return { status: "ok", latencyMs, detail: `queueDepth=${depth}` };
  } catch (err) {
    return { status: "error", latencyMs: Date.now() - start, detail: String(err) };
  }
}

async function checkDynamo(): Promise<CheckResult> {
  const table = readDynamoTable();
  const region = readAwsRegion();
  if (!table || !region) {
    return { status: "unconfigured", detail: "AWS_DYNAMODB_ORCHESTRATION_TABLE or AWS_REGION not set" };
  }

  const client = new DynamoDBClient({ region, credentials: readAwsCredentials() });
  const start = Date.now();
  try {
    await withTimeout(client.send(new DescribeTableCommand({ TableName: table })), 3000);
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return { status: "error", latencyMs: Date.now() - start, detail: String(err) };
  }
}

export async function GET(): Promise<Response> {
  const traceId = createTraceId();

  const [clerk, bedrock, sqs, dynamo] = await Promise.all([
    checkClerk(),
    checkBedrock(),
    checkSqs(),
    checkDynamo()
  ]);

  const checks = { clerk, bedrock, sqs, dynamo };

  const hasError = Object.values(checks).some((c) => c.status === "error");
  const overallStatus = hasError ? "degraded" : "ok";

  return NextResponse.json(
    {
      status: overallStatus,
      service: "rwfw-los",
      timestampIso: new Date().toISOString(),
      checks
    },
    {
      status: hasError ? 503 : 200,
      headers: { [TRACE_HEADER]: traceId }
    }
  );
}
