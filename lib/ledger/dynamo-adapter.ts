import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

import { readAwsCredentials, readAwsRegion } from "@/lib/cloud/awsEnv";

import type { LedgerRecord } from "./adapter";

/**
 * Async ledger adapter interface for server-side adapters that require async I/O
 * (e.g. DynamoDB). The SQLite adapter is wrapped to match this interface via
 * wrapSyncAdapter in lib/ledger/server-adapter.ts.
 */
export type AsyncLedgerAdapter = {
  readAll(): Promise<LedgerRecord[]>;
  upsert(record: LedgerRecord): Promise<LedgerRecord>;
  findByMission(missionId: string): Promise<LedgerRecord[]>;
};

/**
 * Creates a DynamoDB-backed ledger adapter.
 *
 * DynamoDB schema:
 *   pk  = "ledger#<learnerId>"   (partition key)
 *   sk  = "<record.id>"          (sort key)
 *   + all LedgerRecord fields stored as top-level attributes
 *
 * The table must have pk (S) as the partition key and sk (S) as the sort key.
 * Use AWS_DYNAMODB_LEDGER_TABLE or fall back to AWS_DYNAMODB_ORCHESTRATION_TABLE.
 */
export function createDynamoLedgerAdapter(tableName: string): AsyncLedgerAdapter {
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: readAwsRegion(),
      credentials: readAwsCredentials()
    })
  );

  return {
    async readAll(): Promise<LedgerRecord[]> {
      const result = await client.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: "begins_with(pk, :prefix)",
          ExpressionAttributeValues: { ":prefix": "ledger#" }
        })
      );

      return (result.Items ?? []).map(itemToRecord);
    },

    async upsert(record: LedgerRecord): Promise<LedgerRecord> {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: `ledger#${record.learnerId}`,
            sk: record.id,
            ...record
          }
        })
      );

      return record;
    },

    async findByMission(missionId: string): Promise<LedgerRecord[]> {
      const all = await this.readAll();
      return all.filter((r) => r.missionId === missionId);
    }
  };
}

function itemToRecord(item: Record<string, unknown>): LedgerRecord {
  // Strip the DynamoDB key fields before casting to LedgerRecord
  const { pk, sk, ...rest } = item;
  void pk;
  void sk;
  return rest as LedgerRecord;
}
