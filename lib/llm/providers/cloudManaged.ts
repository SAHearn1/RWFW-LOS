import type { ModelInferenceRequest, ModelInferenceResponse, ModelProvider } from "../providerContracts";

export class CloudManagedProvider implements ModelProvider {
  readonly name = "cloud_managed" as const;

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env.AWS_REGION && process.env.AWS_EVENTBRIDGE_BUS_NAME);
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

    return {
      requestId: request.requestId,
      provider: "cloud_managed",
      outputText: `Cloud managed stub response for model ${request.model}.`,
      latencyMs: 0,
      usedFallback: false
    };
  }
}
