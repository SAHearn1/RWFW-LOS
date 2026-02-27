import type { ModelInferenceRequest, ModelInferenceResponse, ModelProvider } from "./providerContracts";
import { resolveModelRoutingDecision, type RouterContext } from "./routerContracts";

export class ModelRouter {
  constructor(
    private readonly localProvider: ModelProvider,
    private readonly cloudProvider: ModelProvider,
    private readonly context: RouterContext
  ) {}

  async infer(request: ModelInferenceRequest): Promise<ModelInferenceResponse> {
    const decision = resolveModelRoutingDecision(request, this.context);

    if (decision.primaryProvider === "local_ollama") {
      let local: ModelInferenceResponse | null = null;
      try {
        local = await this.localProvider.infer(request);
      } catch {
        // Provider threw — treat as fallback-needed
      }

      if (local && !local.usedFallback) {
        return local;
      }

      if (decision.fallbackProvider === "cloud_managed") {
        return this.cloudProvider.infer(request);
      }

      if (local) return local;
      throw new Error("local_ollama provider failed and no fallback is configured");
    }

    let cloud: ModelInferenceResponse | null = null;
    try {
      cloud = await this.cloudProvider.infer(request);
    } catch {
      // Provider threw — treat as fallback-needed
    }

    if (cloud && !cloud.usedFallback) {
      return cloud;
    }

    if (decision.fallbackProvider === "local_ollama") {
      return this.localProvider.infer(request);
    }

    if (cloud) return cloud;
    throw new Error("cloud_managed provider failed and no fallback is configured");
  }
}
