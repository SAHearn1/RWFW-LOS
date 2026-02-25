export const MODEL_PROVIDER_NAMES = ["local_ollama", "cloud_managed"] as const;

export type ModelProviderName = (typeof MODEL_PROVIDER_NAMES)[number];

export type PrivacyMode = "strict_local" | "hybrid" | "cloud_allowed";

export type ModelInferenceRequest = {
  requestId: string;
  model: string;
  prompt: string;
  role: string;
  orgId?: string;
  privacyMode: PrivacyMode;
  maxTokens?: number;
  temperature?: number;
};

export type ModelInferenceResponse = {
  requestId: string;
  provider: ModelProviderName;
  outputText: string;
  latencyMs: number;
  usedFallback: boolean;
};

export type ModelInferenceError = {
  requestId: string;
  provider: ModelProviderName;
  code: string;
  message: string;
  retryable: boolean;
};

export interface ModelProvider {
  readonly name: ModelProviderName;
  isAvailable(): Promise<boolean>;
  infer(request: ModelInferenceRequest): Promise<ModelInferenceResponse>;
}
