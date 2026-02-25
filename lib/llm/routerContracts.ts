import type { ModelInferenceRequest, ModelProviderName } from "./providerContracts";

export type ModelRoutingPolicy = "local_first" | "balanced" | "cloud_first";

export type ModelRoutingDecision = {
  requestId: string;
  policy: ModelRoutingPolicy;
  primaryProvider: ModelProviderName;
  fallbackProvider?: ModelProviderName;
  rationale: string;
};

export type RouterContext = {
  policy: ModelRoutingPolicy;
  localProviderEnabled: boolean;
  cloudProviderEnabled: boolean;
};

export function resolveModelRoutingDecision(request: ModelInferenceRequest, context: RouterContext): ModelRoutingDecision {
  const base = {
    requestId: request.requestId,
    policy: context.policy
  } as const;

  if (request.privacyMode === "strict_local") {
    return {
      ...base,
      primaryProvider: "local_ollama",
      fallbackProvider: context.cloudProviderEnabled ? "cloud_managed" : undefined,
      rationale: "privacy mode requires local-first execution"
    };
  }

  if (context.policy === "cloud_first" && context.cloudProviderEnabled) {
    return {
      ...base,
      primaryProvider: "cloud_managed",
      fallbackProvider: context.localProviderEnabled ? "local_ollama" : undefined,
      rationale: "router policy configured for cloud-first execution"
    };
  }

  if (context.localProviderEnabled) {
    return {
      ...base,
      primaryProvider: "local_ollama",
      fallbackProvider: context.cloudProviderEnabled ? "cloud_managed" : undefined,
      rationale: "defaulting to local-first execution"
    };
  }

  return {
    ...base,
    primaryProvider: "cloud_managed",
    rationale: "local provider unavailable, using cloud provider"
  };
}
