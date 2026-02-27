import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

import { readAwsCredentials, readAwsRegion, readEventBridgeBusName } from "@/lib/cloud/awsEnv";

import type { ModelInferenceRequest, ModelInferenceResponse, ModelProvider } from "../providerContracts";

function readBedrockModelId(): string {
  const val = process.env["BEDROCK_MODEL_ID"];
  return val && val.trim().length > 0 ? val.trim() : "amazon.titan-text-express-v1";
}

function buildRequestBody(
  modelId: string,
  prompt: string,
  maxTokens: number,
  temperature: number
): Record<string, unknown> {
  // Titan models
  if (modelId.startsWith("amazon.titan-text")) {
    return {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: maxTokens,
        temperature
      }
    };
  }

  // Anthropic Claude models via Bedrock (Messages API)
  if (modelId.startsWith("anthropic.claude")) {
    return {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }]
    };
  }

  // Llama / Meta models
  if (modelId.startsWith("meta.llama")) {
    return {
      prompt,
      max_gen_len: maxTokens,
      temperature
    };
  }

  // Cohere models
  if (modelId.startsWith("cohere.command")) {
    return {
      prompt,
      max_tokens: maxTokens,
      temperature
    };
  }

  // AI21 Jurassic / Jamba
  if (modelId.startsWith("ai21.")) {
    return {
      prompt,
      maxTokens,
      temperature
    };
  }

  // Fallback: use Titan-style body
  return {
    inputText: prompt,
    textGenerationConfig: {
      maxTokenCount: maxTokens,
      temperature
    }
  };
}

function extractOutputText(modelId: string, parsed: Record<string, unknown>): string {
  // Titan
  if (modelId.startsWith("amazon.titan-text")) {
    const results = parsed["results"] as Array<Record<string, unknown>> | undefined;
    const text = results?.[0]?.["outputText"];
    if (typeof text === "string") return text;
  }

  // Anthropic Claude via Bedrock
  if (modelId.startsWith("anthropic.claude")) {
    const content = parsed["content"] as Array<Record<string, unknown>> | undefined;
    const text = content?.[0]?.["text"];
    if (typeof text === "string") return text;
  }

  // Llama / Meta
  if (modelId.startsWith("meta.llama")) {
    const text = parsed["generation"];
    if (typeof text === "string") return text;
  }

  // Cohere
  if (modelId.startsWith("cohere.command")) {
    const generations = parsed["generations"] as Array<Record<string, unknown>> | undefined;
    const text = generations?.[0]?.["text"];
    if (typeof text === "string") return text;
  }

  // AI21
  if (modelId.startsWith("ai21.")) {
    const completions = parsed["completions"] as Array<Record<string, unknown>> | undefined;
    const text = completions?.[0]?.["data"]?.["text" as keyof typeof completions[0]["data"]];
    if (typeof text === "string") return text;
    // Jamba format
    const choices = parsed["choices"] as Array<Record<string, unknown>> | undefined;
    const jText = choices?.[0]?.["message"]?.["content" as keyof typeof choices[0]["message"]];
    if (typeof jText === "string") return jText;
  }

  // Last resort: stringify whatever came back
  return JSON.stringify(parsed);
}

export class CloudManagedProvider implements ModelProvider {
  readonly name = "cloud_managed" as const;

  async isAvailable(): Promise<boolean> {
    return Boolean(readAwsRegion() && (readEventBridgeBusName() || readBedrockModelId()));
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
    const modelId = readBedrockModelId();
    const maxTokens = request.maxTokens ?? 512;
    const temperature = request.temperature ?? 0.7;

    try {
      // --- Real Bedrock inference ---
      const bedrockClient = new BedrockRuntimeClient({
        region: readAwsRegion(),
        credentials: readAwsCredentials()
      });

      const requestBody = buildRequestBody(modelId, request.prompt, maxTokens, temperature);

      const bedrockResponse = await bedrockClient.send(
        new InvokeModelCommand({
          modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify(requestBody)
        })
      );

      const parsed = JSON.parse(
        Buffer.from(bedrockResponse.body).toString()
      ) as Record<string, unknown>;

      const outputText = extractOutputText(modelId, parsed);

      // --- Non-blocking EventBridge event for observability ---
      const busName = readEventBridgeBusName();
      if (busName) {
        const ebClient = new EventBridgeClient({
          region: readAwsRegion(),
          credentials: readAwsCredentials()
        });
        ebClient
          .send(
            new PutEventsCommand({
              Entries: [
                {
                  EventBusName: busName,
                  Source: "rwfw.los.inference",
                  DetailType: "cloud.inference.completed",
                  Detail: JSON.stringify({
                    requestId: request.requestId,
                    model: modelId,
                    role: request.role,
                    privacyMode: request.privacyMode,
                    latencyMs: Date.now() - startedAt
                  })
                }
              ]
            })
          )
          .catch(() => {});
      }

      return {
        requestId: request.requestId,
        provider: "cloud_managed",
        outputText,
        latencyMs: Date.now() - startedAt,
        usedFallback: false
      };
    } catch (error) {
      return {
        requestId: request.requestId,
        provider: "cloud_managed",
        outputText: `cloud_inference_failed: ${error instanceof Error ? error.message : "unknown_error"}`,
        latencyMs: Date.now() - startedAt,
        usedFallback: true
      };
    }
  }
}
