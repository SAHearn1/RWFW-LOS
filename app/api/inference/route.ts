import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { CloudManagedProvider } from "@/lib/llm/providers/cloudManaged";
import { LocalOllamaProvider } from "@/lib/llm/providers/localOllama";
import type { ModelInferenceRequest, PrivacyMode } from "@/lib/llm/providerContracts";
import { ModelRouter } from "@/lib/llm/router";
import type { ModelRoutingPolicy } from "@/lib/llm/routerContracts";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";

type InferenceBody = {
  prompt?: string;
  model?: string;
  privacyMode?: PrivacyMode;
  maxTokens?: number;
  temperature?: number;
};

function resolvePolicy(): ModelRoutingPolicy {
  const policy = process.env.MODEL_ROUTING_POLICY;
  if (policy === "cloud_first" || policy === "balanced" || policy === "local_first") {
    return policy;
  }

  return "local_first";
}

function toInferenceRequest(body: InferenceBody, role: string, requestId: string): ModelInferenceRequest | null {
  if (!body.prompt || body.prompt.trim().length === 0) {
    return null;
  }

  const maxTokens = typeof body.maxTokens === "number"
    ? Math.max(1, Math.min(4096, Math.round(body.maxTokens)))
    : undefined;
  const temperature = typeof body.temperature === "number"
    ? Math.max(0, Math.min(1, body.temperature))
    : undefined;

  return {
    requestId,
    model: body.model ?? process.env.OLLAMA_MODEL ?? "llama3.1:8b",
    prompt: body.prompt,
    role,
    privacyMode: body.privacyMode ?? "hybrid",
    maxTokens,
    temperature
  };
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return NextResponse.json(
      { error: "Authorized role required." },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const rateLimitResponse = enforceRateLimit(user.id, "/api/inference", RATE_LIMITS.inference, traceId);
  if (rateLimitResponse) return rateLimitResponse;

  let body: InferenceBody;
  try {
    body = (await request.json()) as InferenceBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const inferenceRequest = toInferenceRequest(body, role, traceId);
  if (!inferenceRequest) {
    return NextResponse.json(
      { error: "Prompt is required." },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const localProvider = new LocalOllamaProvider();
  const cloudProvider = new CloudManagedProvider();

  const router = new ModelRouter(localProvider, cloudProvider, {
    policy: resolvePolicy(),
    localProviderEnabled: await localProvider.isAvailable(),
    cloudProviderEnabled: await cloudProvider.isAvailable()
  });

  const result = await router.infer(inferenceRequest);

  return NextResponse.json(
    { result },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
