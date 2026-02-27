import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

import { readAwsCredentials, readAwsRegion } from "@/lib/cloud/awsEnv";
import type { RuntimeState } from "@/lib/runtime/engine/reducer";
import { createInitialRuntimeState } from "@/lib/runtime/engine/reducer";

function read(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v?.length ? v : undefined;
}

export type RuntimeStateResult =
  | { available: false; reason: string }
  | { available: true; adapter: RuntimeStateAdapter };

export interface RuntimeStateAdapter {
  read(learnerId: string): Promise<RuntimeState>;
  write(learnerId: string, state: RuntimeState): Promise<void>;
}

export function getRuntimeStateAdapter(): RuntimeStateResult {
  const table = read("AWS_DYNAMODB_RUNTIME_TABLE");
  const region = readAwsRegion();

  if (!table) {
    return { available: false, reason: "AWS_DYNAMODB_RUNTIME_TABLE is not set." };
  }
  if (!region) {
    return { available: false, reason: "AWS_REGION is not set." };
  }

  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region, credentials: readAwsCredentials() })
  );

  return {
    available: true,
    adapter: {
      async read(learnerId: string): Promise<RuntimeState> {
        const result = await client.send(
          new GetCommand({ TableName: table, Key: { pk: `runtime#${learnerId}`, sk: "state" } })
        );
        if (!result.Item) {
          return createInitialRuntimeState();
        }
        const { pk, sk, ...rest } = result.Item;
        void pk; void sk;
        return rest as RuntimeState;
      },

      async write(learnerId: string, state: RuntimeState): Promise<void> {
        await client.send(
          new PutCommand({
            TableName: table,
            Item: { pk: `runtime#${learnerId}`, sk: "state", ...state }
          })
        );
      }
    }
  };
}
