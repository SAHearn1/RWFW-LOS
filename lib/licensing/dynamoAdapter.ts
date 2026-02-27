import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

import { readAwsCredentials, readAwsRegion } from "@/lib/cloud/awsEnv";
import type { LicenseTenant, TeacherAssignmentRecord } from "@/lib/licensing/types";

function read(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v?.length ? v : undefined;
}

export type LicensingAdapterResult =
  | { available: false; reason: string }
  | { available: true; adapter: LicensingAdapter };

export interface LicensingAdapter {
  getAllTenants(): Promise<LicenseTenant[]>;
  getTenant(id: string): Promise<LicenseTenant | null>;
  upsertTenant(tenant: LicenseTenant): Promise<LicenseTenant>;
  deleteTenant(id: string): Promise<void>;
  getAllAssignments(): Promise<TeacherAssignmentRecord[]>;
  upsertAssignment(assignment: TeacherAssignmentRecord): Promise<TeacherAssignmentRecord>;
  deleteAssignment(id: string): Promise<void>;
}

export function getLicensingAdapter(): LicensingAdapterResult {
  const table = read("AWS_DYNAMODB_LICENSING_TABLE");
  const region = readAwsRegion();

  if (!table) {
    return { available: false, reason: "AWS_DYNAMODB_LICENSING_TABLE is not set." };
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
      async getAllTenants(): Promise<LicenseTenant[]> {
        const result = await client.send(
          new ScanCommand({
            TableName: table,
            FilterExpression: "begins_with(pk, :prefix)",
            ExpressionAttributeValues: { ":prefix": "tenant#" }
          })
        );
        return (result.Items ?? []).map(({ pk, sk, ...rest }) => {
          void pk; void sk;
          return rest as LicenseTenant;
        });
      },

      async getTenant(id: string): Promise<LicenseTenant | null> {
        const result = await client.send(
          new GetCommand({ TableName: table, Key: { pk: `tenant#${id}`, sk: "metadata" } })
        );
        if (!result.Item) return null;
        const { pk, sk, ...rest } = result.Item;
        void pk; void sk;
        return rest as LicenseTenant;
      },

      async upsertTenant(tenant: LicenseTenant): Promise<LicenseTenant> {
        await client.send(
          new PutCommand({
            TableName: table,
            Item: { pk: `tenant#${tenant.id}`, sk: "metadata", ...tenant }
          })
        );
        return tenant;
      },

      async deleteTenant(id: string): Promise<void> {
        await client.send(
          new DeleteCommand({ TableName: table, Key: { pk: `tenant#${id}`, sk: "metadata" } })
        );
      },

      async getAllAssignments(): Promise<TeacherAssignmentRecord[]> {
        const result = await client.send(
          new ScanCommand({
            TableName: table,
            FilterExpression: "begins_with(pk, :prefix)",
            ExpressionAttributeValues: { ":prefix": "assignment#" }
          })
        );
        return (result.Items ?? []).map(({ pk, sk, ...rest }) => {
          void pk; void sk;
          return rest as TeacherAssignmentRecord;
        });
      },

      async upsertAssignment(
        assignment: TeacherAssignmentRecord
      ): Promise<TeacherAssignmentRecord> {
        await client.send(
          new PutCommand({
            TableName: table,
            Item: { pk: `assignment#${assignment.id}`, sk: "metadata", ...assignment }
          })
        );
        return assignment;
      },

      async deleteAssignment(id: string): Promise<void> {
        await client.send(
          new DeleteCommand({
            TableName: table,
            Key: { pk: `assignment#${id}`, sk: "metadata" }
          })
        );
      }
    }
  };
}
