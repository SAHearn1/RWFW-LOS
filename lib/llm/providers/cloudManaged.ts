import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

import { readAwsCredentials, readAwsRegion, readEventBridgeBusName } from "@/lib/cloud/awsEnv";

import type { ModelInferenceRequest, ModelInferenceResponse, ModelProvider } from "../providerContracts";

export class CloudManagedProvider implements ModelProvider {
  readonly name = "cloud_managed" as const;

  async isAvailable(): Promise<boolean> {
    return Boolean(readAwsRegion() && readEventBridgeBusName());
  }

  async infer(request: ModelInferenceRequest): Promise<ModelInferenceResponse> {
    const enabled = await this.isAvailable();
    if (!enabled) {
      return {
        requestId: request.requestId,
        provider: "cloud_managed",
        outputText: "Cloud provider unavailable due to missing AWS configuration.",
        latencyMs: 0,
        usedFallback: true
      };
    }

    const startedAt = Date.now();

    try {
      const client = new EventBridgeClient({
        region: readAwsRegion(),
        credentials: readAwsCredentials()
      });
      const put = await client.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: readEventBridgeBusName(),
              Source: "rwfw.los.inference",
              DetailType: "cloud.inference.requested",
              Detail: JSON.stringify({
                requestId: request.requestId,
                model: request.model,
                role: request.role,
                privacyMode: request.privacyMode,
                maxTokens: request.maxTokens,
                temperature: request.temperature
              })
            }
          ]
        })
      );

      const eventId = put.Entries?.[0]?.EventId ?? "unknown";

      return {
        requestId: request.requestId,
        provider: "cloud_managed",
        outputText: `Cloud inference request accepted (eventId=${eventId}).`,
        latencyMs: Date.now() - startedAt,
        usedFallback: false
      };
    } catch (error) {
      return {
        requestId: request.requestId,
        provider: "cloud_managed",
        outputText: `Cloud inference request failed (${error instanceof Error ? error.message : "unknown_error"}).`,
        latencyMs: Date.now() - startedAt,
        usedFallback: true
      };
    }
  }
}
