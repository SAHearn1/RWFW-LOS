import { ConditionalCheckFailedException, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

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
 * Tenant-scoped ledger adapter with optimistic locking.
 *
 * Extends AsyncLedgerAdapter with:
 *  - Tenant-isolated reads/writes using a tenantId partition key prefix
 *  - Optimistic locking via a `version` field and DynamoDB ConditionExpression
 *  - Record versioning for audit trail
 *
 * DynamoDB schema (tenant-scoped):
 *   pk  = "tenant#{tenantId}#ledger#{learnerId}"   (partition key)
 *   sk  = "record#{record.id}"                      (sort key)
 *   version = <integer, incremented on each write>
 *   + all LedgerRecord fields as top-level attributes
 */
export type TenantScopedAsyncLedgerAdapter = AsyncLedgerAdapter & {
  /**
   * Upsert with optimistic locking.
   * @param record - Record to write.
   * @param expectedVersion - Expected current version. 0 means "record must not exist".
   *   Omit to skip version check (last-write-wins semantics).
   * @throws Error("version_conflict") when ConditionExpression fails.
   */
  upsertWithVersion(
    record: LedgerRecord,
    expectedVersion?: number
  ): Promise<{ record: LedgerRecord; version: number }>;
  /** Returns the current version of a record, or null if it does not exist. */
  getVersion(recordId: string, learnerId: string): Promise<number | null>;
};

// ─── Original adapter (no tenant isolation) ───────────────────────────────────

/**
 * Creates a DynamoDB-backed ledger adapter without tenant partitioning.
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

// ─── Tenant-scoped adapter (with optimistic locking) ─────────────────────────

/**
 * Creates a tenant-scoped DynamoDB ledger adapter with optimistic locking.
 *
 * All reads and writes are partitioned by tenantId, preventing cross-tenant
 * data access. Optimistic locking prevents lost updates under concurrent writes.
 *
 * @param tableName - DynamoDB table name (pk S, sk S required).
 * @param tenantId  - Tenant identifier — typically the Clerk orgId.
 */
export function createTenantScopedDynamoLedgerAdapter(
  tableName: string,
  tenantId: string
): TenantScopedAsyncLedgerAdapter {
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: readAwsRegion(),
      credentials: readAwsCredentials()
    })
  );

  function tenantPk(learnerId: string): string {
    return `tenant#${tenantId}#ledger#${learnerId}`;
  }

  function recordSk(recordId: string): string {
    return `record#${recordId}`;
  }

  function itemToTenantRecord(item: Record<string, unknown>): LedgerRecord {
    const { pk, sk, version, ...rest } = item;
    void pk;
    void sk;
    void version;
    return rest as LedgerRecord;
  }

  return {
    async readAll(): Promise<LedgerRecord[]> {
      // Scan is acceptable for admin-level reads; for large tenants, use a GSI.
      const result = await client.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: "begins_with(pk, :prefix)",
          ExpressionAttributeValues: {
            ":prefix": `tenant#${tenantId}#ledger#`
          }
        })
      );

      return (result.Items ?? []).map(itemToTenantRecord);
    },

    async upsert(record: LedgerRecord): Promise<LedgerRecord> {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: tenantPk(record.learnerId),
            sk: recordSk(record.id),
            version: 1,
            ...record
          }
        })
      );
      return record;
    },

    async findByMission(missionId: string): Promise<LedgerRecord[]> {
      // Scan within the tenant partition for mission match.
      // For high-volume tables, add a GSI on (pk + missionId).
      const result = await client.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression:
            "begins_with(pk, :prefix) AND missionId = :missionId",
          ExpressionAttributeValues: {
            ":prefix": `tenant#${tenantId}#ledger#`,
            ":missionId": missionId
          }
        })
      );

      return (result.Items ?? []).map(itemToTenantRecord);
    },

    async getVersion(
      recordId: string,
      learnerId: string
    ): Promise<number | null> {
      const result = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: {
            ":pk": tenantPk(learnerId),
            ":sk": recordSk(recordId)
          },
          ProjectionExpression: "version"
        })
      );

      const item = result.Items?.[0];
      if (!item || typeof item.version !== "number") return null;
      return item.version;
    },

    async upsertWithVersion(
      record: LedgerRecord,
      expectedVersion?: number
    ): Promise<{ record: LedgerRecord; version: number }> {
      const newVersion = (expectedVersion ?? 0) + 1;

      const putItem = {
        pk: tenantPk(record.learnerId),
        sk: recordSk(record.id),
        version: newVersion,
        ...record
      };

      const command =
        expectedVersion === undefined
          ? new PutCommand({ TableName: tableName, Item: putItem })
          : new PutCommand({
              TableName: tableName,
              Item: putItem,
              ConditionExpression:
                "attribute_not_exists(version) OR version = :expectedVersion",
              ExpressionAttributeValues: {
                ":expectedVersion": expectedVersion
              }
            });

      try {
        await client.send(command);
        return { record, version: newVersion };
      } catch (error) {
        if (error instanceof ConditionalCheckFailedException) {
          throw new Error(
            `version_conflict: record ${record.id} has been modified by another writer. ` +
              `Expected version ${expectedVersion ?? "new"}.`
          );
        }
        throw error;
      }
    }
  };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function itemToRecord(item: Record<string, unknown>): LedgerRecord {
  // Strip the DynamoDB key fields before casting to LedgerRecord
  const { pk, sk, ...rest } = item;
  void pk;
  void sk;
  return rest as LedgerRecord;
}
