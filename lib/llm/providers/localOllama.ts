import type { ModelInferenceRequest, ModelInferenceResponse, ModelProvider } from "../providerContracts";

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_TIMEOUT_MS = 10_000;

type OllamaGenerateResponse = {
  response?: string;
};

function buildResponse(
  request: ModelInferenceRequest,
  outputText: string,
  latencyMs: number,
  usedFallback: boolean
): ModelInferenceResponse {
  return {
    requestId: request.requestId,
    provider: "local_ollama",
    outputText,
    latencyMs,
    usedFallback
  };
}

function resolveOllamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");
}

function resolveOllamaModel(request: ModelInferenceRequest): string {
  return process.env.OLLAMA_MODEL ?? request.model;
}

function resolveTimeoutMs(): number {
  const parsed = Number.parseInt(process.env.OLLAMA_TIMEOUT_MS ?? "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_OLLAMA_TIMEOUT_MS;
}

export class LocalOllamaProvider implements ModelProvider {
  readonly name = "local_ollama" as const;

  async isAvailable(): Promise<boolean> {
    return process.env.NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA === "true";
  }

  async infer(request: ModelInferenceRequest): Promise<ModelInferenceResponse> {
    const enabled = await this.isAvailable();
    if (!enabled) {
      return buildResponse(request, "Local Ollama disabled by feature flag.", 0, true);
    }

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutMs = resolveTimeoutMs();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${resolveOllamaBaseUrl()}/api/generate`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: resolveOllamaModel(request),
          prompt: request.prompt,
          stream: false,
          options: {
            temperature: request.temperature,
            num_predict: request.maxTokens
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        return buildResponse(
          request,
          `Local Ollama unavailable: HTTP ${response.status}.`,
          Date.now() - startedAt,
          true
        );
      }

      const payload = (await response.json()) as OllamaGenerateResponse;
      const text = payload.response?.trim();
      if (!text) {
        return buildResponse(request, "Local Ollama returned an empty response.", Date.now() - startedAt, true);
      }

      return buildResponse(request, text, Date.now() - startedAt, false);
    } catch (error) {
      const isAbortError = error instanceof Error && error.name === "AbortError";
      const message = isAbortError
        ? `Local Ollama request timed out after ${timeoutMs}ms.`
        : "Local Ollama request failed.";
      return buildResponse(request, message, Date.now() - startedAt, true);
    } finally {
      clearTimeout(timeout);
    }
  }
}
