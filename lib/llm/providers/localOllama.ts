import type { ModelInferenceRequest, ModelInferenceResponse, ModelProvider } from "../providerContracts";

function buildFallbackResponse(request: ModelInferenceRequest, outputText: string): ModelInferenceResponse {
  return {
    requestId: request.requestId,
    provider: "local_ollama",
    outputText,
    latencyMs: 0,
    usedFallback: false
  };
}

export class LocalOllamaProvider implements ModelProvider {
  readonly name = "local_ollama" as const;

  async isAvailable(): Promise<boolean> {
    return process.env.NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA === "true";
  }

  async infer(request: ModelInferenceRequest): Promise<ModelInferenceResponse> {
    const enabled = await this.isAvailable();
    if (!enabled) {
      return buildFallbackResponse(request, "Local Ollama disabled by feature flag.");
    }

    return buildFallbackResponse(request, `Local Ollama stub response for model ${request.model}.`);
  }
}
