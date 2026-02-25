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
      const local = await this.localProvider.infer(request);
      if (!local.usedFallback) {
        return local;
      }

      if (decision.fallbackProvider === "cloud_managed") {
        return this.cloudProvider.infer(request);
      }

      return local;
    }

    const cloud = await this.cloudProvider.infer(request);
    if (!cloud.usedFallback) {
      return cloud;
    }

    if (decision.fallbackProvider === "local_ollama") {
      return this.localProvider.infer(request);
    }

    return cloud;
  }
}
