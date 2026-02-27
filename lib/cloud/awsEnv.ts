import type { AwsCredentialIdentity } from "@aws-sdk/types";

function read(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readAwsRegion(): string | undefined {
  return read("AWS_REGION");
}

export function readSqsQueueUrl(): string | undefined {
  return read("AWS_SQS_QUEUE_URL");
}

export function readDynamoTable(): string | undefined {
  return read("AWS_DYNAMODB_ORCHESTRATION_TABLE");
}

export function readEventBridgeBusName(): string | undefined {
  return read("AWS_EVENTBRIDGE_BUS_NAME");
}

export function readAwsCredentials(): AwsCredentialIdentity | undefined {
  const accessKeyId = read("AWS_ACCESS_KEY_ID");
  const secretAccessKey = read("AWS_SECRET_ACCESS_KEY");
  if (!accessKeyId || !secretAccessKey) {
    return undefined;
  }

  const sessionToken = read("AWS_SESSION_TOKEN");
  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {})
  };
}
