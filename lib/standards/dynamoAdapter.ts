import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

import { readAwsCredentials, readAwsRegion } from "@/lib/cloud/awsEnv";
import type { StandardDescriptor } from "@/lib/standards/contracts/types";

function read(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v?.length ? v : undefined;
}

export type StandardsAdapterResult =
  | { available: false; reason: string }
  | { available: true; adapter: StandardsAdapter };

export interface StandardsAdapter {
  readConfig(): Promise<StandardDescriptor[] | null>;
  writeConfig(standards: StandardDescriptor[]): Promise<void>;
}

export function getStandardsAdapter(): StandardsAdapterResult {
  const table = read("AWS_DYNAMODB_STANDARDS_TABLE");
  const region = readAwsRegion();

  if (!table) {
    return { available: false, reason: "AWS_DYNAMODB_STANDARDS_TABLE is not set." };
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
      async readConfig(): Promise<StandardDescriptor[] | null> {
        const result = await client.send(
          new GetCommand({ TableName: table, Key: { pk: "standards", sk: "config" } })
        );
        if (!result.Item) return null;
        const { pk, sk, standards } = result.Item as {
          pk: unknown;
          sk: unknown;
          standards: StandardDescriptor[];
        };
        void pk; void sk;
        return standards ?? null;
      },

      async writeConfig(standards: StandardDescriptor[]): Promise<void> {
        await client.send(
          new PutCommand({
            TableName: table,
            Item: { pk: "standards", sk: "config", standards }
          })
        );
      }
    }
  };
}
